// editor-inject.js — Injected into slide iframe to enable WYSIWYG editing
(function () {
  'use strict';

  const DEBOUNCE_MS = 800;
  let contentTimer = null;

  // ── Block selection state ──
  var selectedBlock = null;   // currently selected block element
  var editingBlock = null;    // currently editing block element

  // ── Saved selection for toolbar interactions ──
  let savedRange = null;

  // ── RGB to hex conversion (Bug 3) ──
  function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    // Already hex
    if (rgb.charAt(0) === '#') return rgb;
    var match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return rgb;
    function hex(x) {
      var h = parseInt(x, 10).toString(16);
      return h.length === 1 ? '0' + h : h;
    }
    return '#' + hex(match[1]) + hex(match[2]) + hex(match[3]);
  }

  // ── Google Fonts dynamic loading (Bug 6) ──
  var loadedFonts = {};
  function loadGoogleFont(fontFamily) {
    if (!fontFamily || loadedFonts[fontFamily]) return;
    // Skip system fonts
    var systemFonts = ['Arial', 'Georgia', 'Courier New', 'Times New Roman', 'serif', 'sans-serif', 'monospace'];
    if (systemFonts.indexOf(fontFamily) !== -1) return;
    loadedFonts[fontFamily] = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(fontFamily).replace(/%20/g, '+') + ':wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  // ── Block detection ──

  function getSelectableBlocks() {
    var children = [];
    var bodyChildren = document.body.children;
    for (var i = 0; i < bodyChildren.length; i++) {
      var el = bodyChildren[i];
      var tag = el.tagName.toUpperCase();
      if (tag === 'SCRIPT' || tag === 'STYLE') continue;
      children.push(el);
    }

    // If body has exactly one child div, use its children as blocks (wrapper pattern)
    if (children.length === 1 && children[0].tagName.toUpperCase() === 'DIV') {
      var wrapper = children[0];
      var innerChildren = [];
      for (var j = 0; j < wrapper.children.length; j++) {
        var inner = wrapper.children[j];
        var innerTag = inner.tagName.toUpperCase();
        if (innerTag === 'SCRIPT' || innerTag === 'STYLE') continue;
        innerChildren.push(inner);
      }
      if (innerChildren.length > 0) return innerChildren;
    }

    return children;
  }

  function findBlock(target) {
    var blocks = getSelectableBlocks();
    var node = target;
    while (node && node !== document.body && node !== document.documentElement) {
      if (blocks.indexOf(node) !== -1) return node;
      node = node.parentNode;
    }
    return null;
  }

  function getBlockIndex(block) {
    var blocks = getSelectableBlocks();
    return blocks.indexOf(block);
  }

  // ── Selection / editing helpers ──

  function clearSelection() {
    if (selectedBlock) {
      selectedBlock.style.outline = '';
      selectedBlock.style.outlineOffset = '';
      selectedBlock = null;
    }
  }

  function endEditing() {
    if (!editingBlock) return;
    editingBlock.removeAttribute('contenteditable');
    editingBlock = null;
    savedRange = null;
    // Notify parent
    window.parent.postMessage({ type: 'block-edit-end' }, '*');
    // Trigger content change for auto-save
    notifyContentChange();
  }

  function selectBlock(block) {
    if (block === selectedBlock) return;
    clearSelection();
    selectedBlock = block;
    block.style.outline = '2px dashed #3b82f6';
    block.style.outlineOffset = '4px';
    // Notify parent
    var idx = getBlockIndex(block);
    var hasText = (block.textContent || '').trim().length > 0;
    window.parent.postMessage({
      type: 'block-select',
      blockIndex: idx,
      blockTag: block.tagName.toLowerCase(),
      hasText: hasText,
    }, '*');
  }

  function startEditing(block) {
    if (editingBlock === block) return;
    if (editingBlock) endEditing();
    editingBlock = block;
    block.setAttribute('contenteditable', 'true');
    block.focus();
    // Place cursor at end of block content
    var sel = window.getSelection();
    if (sel) {
      var range = document.createRange();
      range.selectNodeContents(block);
      range.collapse(false); // collapse to end
      sel.removeAllRanges();
      sel.addRange(range);
    }
    // Change outline to solid
    block.style.outline = '2px solid #3b82f6';
    block.style.outlineOffset = '4px';
    // Notify parent
    var idx = getBlockIndex(block);
    window.parent.postMessage({
      type: 'block-edit-start',
      blockIndex: idx,
    }, '*');
  }

  // ── Initialize blocks ──

  function initBlocks() {
    // Remove body contenteditable if present
    document.body.removeAttribute('contenteditable');

    var blocks = getSelectableBlocks();
    for (var i = 0; i < blocks.length; i++) {
      blocks[i].style.cursor = 'default';
    }
  }

  // ── Selection state reporting ──

  function getSelectionState() {
    var sel = window.getSelection();

    function qc(cmd) {
      try { return document.queryCommandState(cmd); } catch(e) { return false; }
    }
    function qv(cmd) {
      try { return document.queryCommandValue(cmd) || ''; } catch(e) { return ''; }
    }

    // Determine block type from current selection
    var blockType = 'p';
    if (sel && sel.rangeCount > 0) {
      var node = sel.anchorNode;
      while (node && node !== document.body) {
        if (node.nodeType === 1) {
          var tag = node.tagName.toLowerCase();
          if (['h1','h2','h3','h4','h5','h6','p','blockquote','pre'].indexOf(tag) !== -1) {
            blockType = tag;
            break;
          }
        }
        node = node.parentNode;
      }
    }

    // Determine text alignment
    var textAlign = 'left';
    if (qc('justifyCenter')) textAlign = 'center';
    else if (qc('justifyRight')) textAlign = 'right';
    else if (qc('justifyFull')) textAlign = 'justify';

    // Bug 4: Get fontSize and fontFamily from computedStyle instead of queryCommandValue
    var fontSize = '16px';
    var fontFamily = '';
    if (sel && sel.anchorNode) {
      var targetNode = sel.anchorNode;
      if (targetNode.nodeType === 3) targetNode = targetNode.parentNode; // text node → parent element
      if (targetNode && targetNode.nodeType === 1) {
        var cs = window.getComputedStyle(targetNode);
        fontSize = cs.fontSize || '16px';
        fontFamily = cs.fontFamily.replace(/["']/g, '').split(',')[0].trim();
      }
    }

    // Bug 3: Convert foreColor and backColor to hex
    var foreColor = rgbToHex(qv('foreColor')) || '#000000';
    var backColor = qv('backColor');
    if (backColor && backColor !== 'transparent') {
      backColor = rgbToHex(backColor);
    } else {
      backColor = 'transparent';
    }

    // Bug 5: undo/redo availability
    var undoAvailable = false;
    var redoAvailable = false;
    try { undoAvailable = document.queryCommandEnabled('undo'); } catch(e) {}
    try { redoAvailable = document.queryCommandEnabled('redo'); } catch(e) {}

    return {
      bold: qc('bold'),
      italic: qc('italic'),
      underline: qc('underline'),
      strikethrough: qc('strikeThrough'),
      fontFamily: fontFamily,
      fontSize: fontSize,
      textAlign: textAlign,
      foreColor: foreColor,
      backColor: backColor,
      blockType: blockType,
      orderedList: qc('insertOrderedList'),
      unorderedList: qc('insertUnorderedList'),
      undoAvailable: undoAvailable,
      redoAvailable: redoAvailable,
    };
  }

  function notifySelectionChange() {
    window.parent.postMessage({
      type: 'selection-change',
      selection: getSelectionState(),
    }, '*');
  }

  function notifyContentChange() {
    if (contentTimer) clearTimeout(contentTimer);
    contentTimer = setTimeout(function () {
      window.parent.postMessage({
        type: 'content-change',
        html: document.body.innerHTML,
      }, '*');
    }, DEBOUNCE_MS);
  }

  // ── Get clean full HTML ──

  function getFullHtml() {
    // Clone the document to avoid modifying the live DOM
    var clone = document.documentElement.cloneNode(true);

    // Remove contenteditable from all elements
    var body = clone.querySelector('body');
    if (body) {
      body.removeAttribute('contenteditable');
      var editables = body.querySelectorAll('[contenteditable]');
      for (var i = 0; i < editables.length; i++) {
        editables[i].removeAttribute('contenteditable');
      }
    }

    // Remove block selection outlines
    var allElements = clone.querySelectorAll('*');
    for (var j = 0; j < allElements.length; j++) {
      var el = allElements[j];
      if (el.style.outline) el.style.outline = '';
      if (el.style.outlineOffset) el.style.outlineOffset = '';
      if (el.style.cursor === 'default') el.style.cursor = '';
      // Clean up empty style attribute
      if (el.getAttribute('style') === '') el.removeAttribute('style');
    }

    // Remove injected script
    var scripts = clone.querySelectorAll('script[src*="editor-inject"]');
    scripts.forEach(function (s) { s.remove(); });

    return '<!DOCTYPE html>\n<html' +
      (clone.getAttribute('lang') ? ' lang="' + clone.getAttribute('lang') + '"' : '') +
      '>\n' + clone.innerHTML + '\n</html>';
  }

  // ── Custom font/size handling via span wrapping ──

  function restoreSelection() {
    if (!editingBlock) return false;
    if (!savedRange) return false;
    var sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
  }

  function applySpanStyle(property, value) {
    var sel = window.getSelection();
    if (!sel) return;

    // If current selection is collapsed, try restoring saved selection
    if (sel.rangeCount === 0 || sel.isCollapsed) {
      if (!restoreSelection()) return;
      sel = window.getSelection();
    }

    var range = sel.getRangeAt(0);
    if (range.collapsed) return;

    // Extract selected content and wrap in span
    var span = document.createElement('span');
    span.style[property] = value;
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      // Re-select the wrapped content
      sel.removeAllRanges();
      var newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
      // Update saved range
      savedRange = newRange.cloneRange();
    } catch (e) {
      console.warn('applySpanStyle failed:', e);
    }
  }

  // ── Message handler from parent ──

  // Bug 7: Commands that need selection restoration before execution
  var COMMANDS_NEEDING_SELECTION = [
    'format-command', 'block-type', 'font-family', 'font-size',
    'fore-color', 'back-color', 'clear-formatting', 'insert-link'
  ];

  function handleMessage(event) {
    var msg = event.data;
    if (!msg || !msg.type) return;

    // Ignore editing commands if not in editing mode
    if (COMMANDS_NEEDING_SELECTION.indexOf(msg.type) !== -1) {
      if (!editingBlock) return;
      restoreSelection();
    }

    switch (msg.type) {
      case 'format-command':
        document.execCommand(msg.command, false, null);
        notifySelectionChange();
        notifyContentChange();
        break;

      case 'block-type':
        document.execCommand('formatBlock', false, '<' + msg.tag + '>');
        notifySelectionChange();
        notifyContentChange();
        break;

      case 'font-family':
        loadGoogleFont(msg.family);
        applySpanStyle('fontFamily', msg.family);
        notifySelectionChange();
        notifyContentChange();
        break;

      case 'font-size':
        applySpanStyle('fontSize', msg.size);
        notifySelectionChange();
        notifyContentChange();
        break;

      case 'fore-color':
        document.execCommand('foreColor', false, msg.color);
        notifySelectionChange();
        notifyContentChange();
        break;

      case 'back-color':
        document.execCommand('hiliteColor', false, msg.color);
        notifySelectionChange();
        notifyContentChange();
        break;

      case 'clear-formatting':
        document.execCommand('removeFormat', false, null);
        notifySelectionChange();
        notifyContentChange();
        break;

      case 'undo':
        document.execCommand('undo', false, null);
        notifySelectionChange();
        notifyContentChange();
        break;

      case 'redo':
        document.execCommand('redo', false, null);
        notifySelectionChange();
        notifyContentChange();
        break;

      case 'insert-link': {
        var sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          document.execCommand('createLink', false, msg.url);
        } else if (msg.text) {
          document.execCommand('insertHTML', false,
            '<a href="' + msg.url + '">' + msg.text + '</a>');
        }
        notifyContentChange();
        break;
      }

      case 'insert-image':
        document.execCommand('insertImage', false, msg.src);
        notifyContentChange();
        break;

      case 'get-html':
        window.parent.postMessage({
          type: 'html-response',
          html: getFullHtml(),
        }, '*');
        break;

      case 'restore-selection':
        if (editingBlock) restoreSelection();
        break;
    }
  }

  // ── Prevent contenteditable scroll (fixes invisible content) ──
  // When body has overflow:hidden + contenteditable, the browser still scrolls
  // internally to show the caret, pushing content out of view.
  function preventBodyScroll() {
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
  }
  document.addEventListener('scroll', preventBodyScroll, true);
  // Also prevent on focus/click which trigger browser auto-scroll
  document.addEventListener('focus', function () {
    requestAnimationFrame(preventBodyScroll);
  }, true);

  // ── Click handler (body delegation) ──

  document.addEventListener('click', function (e) {
    requestAnimationFrame(preventBodyScroll);

    var target = e.target;
    var block = findBlock(target);

    // Click inside editing block → let text editing work normally
    if (editingBlock && block === editingBlock) return;

    // Click on a different block or background
    if (editingBlock) {
      endEditing();
    }

    if (block) {
      // Click on a block → select it
      selectBlock(block);
    } else {
      // Click on background (no block) → deselect
      clearSelection();
    }
  }, true);

  // ── Double-click handler ──

  document.addEventListener('dblclick', function (e) {
    var target = e.target;
    var block = findBlock(target);
    if (!block) return;

    // Ensure block is selected
    if (selectedBlock !== block) {
      selectBlock(block);
    }

    // Enter editing mode
    startEditing(block);
  }, true);

  // ── Keyboard handler ──

  document.addEventListener('keydown', function (e) {
    // Escape → end editing or deselect
    if (e.key === 'Escape') {
      if (editingBlock) {
        endEditing();
        // Return to selected state
        if (selectedBlock) {
          selectedBlock.style.outline = '2px dashed #3b82f6';
          selectedBlock.style.outlineOffset = '4px';
        }
      } else if (selectedBlock) {
        clearSelection();
      }
      return;
    }

    // Ctrl+S / Cmd+S to trigger save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // Request full HTML then parent will save
      window.parent.postMessage({ type: 'html-response', html: getFullHtml() }, '*');
      return;
    }

    // Enter key on selected (non-editing) block → start editing
    if (e.key === 'Enter' && selectedBlock && !editingBlock) {
      e.preventDefault();
      startEditing(selectedBlock);
      return;
    }
  });

  // ── Event listeners ──

  // Bug 7: Save selection on every selectionchange, including collapsed (cursor position)
  document.addEventListener('selectionchange', function () {
    if (!editingBlock) return;
    var sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }
    notifySelectionChange();
  });
  document.addEventListener('input', notifyContentChange);

  window.addEventListener('message', handleMessage);

  // ── Initialize ──
  initBlocks();

  // ── Notify parent that editor is ready ──
  window.parent.postMessage({ type: 'editor-ready' }, '*');
})();
