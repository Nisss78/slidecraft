/**
 * Built-in Template Catalog for Slide Harness
 *
 * Provides structured template definitions that guide AI-powered slide generation.
 * Each template contains detailed per-slide prompts with specific content, layout
 * instructions, and realistic business data for high-quality output.
 */

import {
  FB_TEMPLATES,
  BEAUTY_TEMPLATES,
  REALESTATE_TEMPLATES,
  MEDICAL_TEMPLATES,
  EDUCATION_TEMPLATES,
  FITNESS_TEMPLATES,
  EC_TEMPLATES,
  IT_TEMPLATES,
  EVENT_TEMPLATES,
  FREELANCE_TEMPLATES,
  PET_TEMPLATES,
} from './templates/index.js';

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface TemplateSlideInstruction {
  title: string;
  layout: string; // title | content | two-column | three-column | split-half | split-60-40 | data-chart | single-design
  prompt: string; // Detailed AI generation instruction (with specific company names, numbers, layout instructions)
}

export interface BuiltInTemplate {
  id: string; // "{format}-{usecase}" e.g. "presentation-business-plan"
  name: string; // English name
  nameJa: string; // Japanese display name
  descriptionJa: string; // Japanese description
  format: string; // canvas preset ID
  suggestedStylePreset: string; // recommended style preset
  alternativeStylePresets: string[]; // alternative options
  slideCount: number;
  tags: string[];
  icon: string; // Font Awesome icon class (e.g. "fa-solid fa-briefcase")
  category: 'business' | 'marketing' | 'creative' | 'data' | 'education' | 'personal';
  slides: TemplateSlideInstruction[];
  generationContext: string; // AI instruction for the entire template
}

// ---------------------------------------------------------------------------
// Built-in Templates
// ---------------------------------------------------------------------------

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  // ==========================================================================
  // PRESENTATION (16:9) - 5 templates
  // ==========================================================================

  {
    id: 'presentation-business-plan',
    name: 'Business Plan',
    nameJa: '事業計画書',
    descriptionJa: 'SaaS企業の事業計画書テンプレート。市場分析、競合比較、財務予測を含む本格的な10枚構成。',
    format: '16:9',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['swiss-modern', 'bold-signal', 'kyoto-classic'],
    slideCount: 10,
    tags: ['事業計画', 'スタートアップ', 'SaaS', '投資', '経営'],
    icon: 'fa-solid fa-briefcase',
    category: 'business',
    generationContext:
      'Fictional SaaS company "Nexora" - cloud-based team analytics platform. Include TAM $42B / SAM $8.5B / SOM $850M, 3 competitor comparison (Slack Analytics, TeamPulse, WorkMetrics), 5-year revenue chart starting $2M to $45M, team of 4 (CEO Yuki Tanaka ex-Google, CTO Sarah Chen ex-AWS, VP Sales James Park ex-Salesforce, Head of Product Maria Santos ex-Notion).',
    slides: [
      {
        title: 'Title Slide',
        layout: 'title',
        prompt:
          'Create a title slide for "Nexora" - a cloud-based team analytics platform. Display the company name in large bold heading with the tagline "Unlock Your Team\'s Hidden Potential" below. Add a subtle grid or data-visualization motif in the background to convey analytics. Include "Business Plan 2026" in smaller text at the bottom-right. Use clean, professional layout with ample whitespace.',
      },
      {
        title: 'Vision & Mission',
        layout: 'content',
        prompt:
          'Create a Vision & Mission slide for Nexora. Vision: "A world where every team operates at peak performance through data-driven insights." Mission: "Empower organizations to understand, measure, and optimize team dynamics using real-time analytics." Display vision and mission as two distinct blocks with a decorative divider between them. Add a small icon (fa-solid fa-eye for vision, fa-solid fa-bullseye for mission) next to each heading. Keep the typography large and impactful with plenty of breathing room.',
      },
      {
        title: 'Market Opportunity',
        layout: 'three-column',
        prompt:
          'Create a Market Opportunity slide showing TAM/SAM/SOM analysis in a three-column layout. Column 1: TAM - Total Addressable Market $42B with a brief note "Global enterprise collaboration & analytics." Column 2: SAM - Serviceable Available Market $8.5B with note "Cloud-based team performance platforms." Column 3: SOM - Serviceable Obtainable Market $850M with note "Mid-market SaaS in NA & APAC." Use large dollar figures as the primary visual element with concentric circle or funnel graphic suggesting market narrowing. Include a source line "Source: Gartner 2025, internal analysis."',
      },
      {
        title: 'Problem Statement',
        layout: 'content',
        prompt:
          'Create a Problem Statement slide for Nexora. Headline: "Teams Are Flying Blind." Present three key pain points as styled cards: 1) "73% of managers cannot quantify team productivity" (fa-solid fa-chart-line-down icon), 2) "Average $12,500/employee/year lost to collaboration friction" (fa-solid fa-dollar-sign icon), 3) "Existing tools measure output, not team health" (fa-solid fa-heart-crack icon). Use a dark or contrasting section to make the statistics stand out. Each card should have the statistic in a large font with a supporting sentence below.',
      },
      {
        title: 'Solution Overview',
        layout: 'split-60-40',
        prompt:
          'Create a Solution Overview slide for Nexora in split-60-40 layout. Left side (60%): Describe the product - "Nexora aggregates signals from Slack, Jira, GitHub, and Calendar to surface actionable team-health metrics in real-time." Include 3 bullet points: real-time dashboards, AI-powered recommendations, privacy-first aggregation. Right side (40%): A stylized mockup placeholder showing a dashboard with charts, a team health score of 87/100, and notification badges. Use a clean product-showcase aesthetic.',
      },
      {
        title: 'Product Features',
        layout: 'three-column',
        prompt:
          'Create a Product Features slide with three feature columns. Column 1: "Real-Time Dashboard" - fa-solid fa-gauge-high icon - "Monitor team velocity, collaboration frequency, and meeting load in a single pane. Auto-refreshes every 60 seconds." Column 2: "AI Coach" - fa-solid fa-robot icon - "Proactive recommendations: reduce meeting overload, rebalance workloads, identify burnout risk before it escalates." Column 3: "Privacy Vault" - fa-solid fa-shield-halved icon - "All data is aggregated and anonymized at the team level. SOC 2 Type II certified. Zero individual tracking." Each column should have a colored icon area at the top, a bold feature name, and a descriptive paragraph.',
      },
      {
        title: 'Competitive Analysis',
        layout: 'content',
        prompt:
          'Create a Competitive Analysis slide with a comparison table. Rows: Features (Real-time Analytics, AI Recommendations, Privacy-First, Integration Depth, Pricing). Columns: Nexora, Slack Analytics, TeamPulse, WorkMetrics. Nexora should have checkmarks or "Yes" for all features with pricing "$12/user/mo." Slack Analytics: partial real-time, no AI, moderate privacy, deep Slack only, $8/user/mo. TeamPulse: batch analytics, basic AI, weak privacy, broad integrations, $15/user/mo. WorkMetrics: real-time, no AI, individual tracking concern, moderate integrations, $20/user/mo. Use green checkmarks and red crosses for clarity. Highlight the Nexora column with a subtle accent background.',
      },
      {
        title: 'Business Model & Revenue',
        layout: 'two-column',
        prompt:
          'Create a Business Model slide in two-column layout. Left column "Business Model": Three pricing tiers displayed as cards - Starter ($8/user/mo, up to 50 users, core analytics), Professional ($12/user/mo, unlimited users, AI Coach, advanced integrations), Enterprise ($20/user/mo, SSO, dedicated support, custom SLAs). Right column "Revenue Streams": Primary: SaaS subscriptions (85%), Secondary: Professional services & onboarding (10%), Tertiary: Marketplace integrations revenue share (5%). Include a small horizontal stacked bar chart showing the 85/10/5 split.',
      },
      {
        title: 'Financial Projections',
        layout: 'data-chart',
        prompt:
          'Create a Financial Projections slide centered on a 5-year revenue chart. Use Chart.js bar+line combo chart. Bar chart: Annual Revenue - Year 1: $2M, Year 2: $7M, Year 3: $16M, Year 4: $28M, Year 5: $45M. Line overlay: EBITDA Margin - Year 1: -45%, Year 2: -15%, Year 3: 8%, Year 4: 18%, Year 5: 24%. Below the chart, display key metrics in a row: "CAC $1,200 | LTV $14,400 | LTV:CAC 12:1 | Payback 4.2 months." Label axes clearly. Use the primary color for revenue bars and accent color for the margin line.',
      },
      {
        title: 'Team & Ask',
        layout: 'split-half',
        prompt:
          'Create a Team & Ask slide in split-half layout. Left side "The Team": Four team member cards arranged in a 2x2 grid. CEO Yuki Tanaka (ex-Google, 12 years in enterprise SaaS), CTO Sarah Chen (ex-AWS, distributed systems expert), VP Sales James Park (ex-Salesforce, $200M+ quota carrier), Head of Product Maria Santos (ex-Notion, built 0-to-1 products). Each card: name in bold, role, one-line credential. Right side "The Ask": Large text "Raising $5M Seed Round" with key details - Use of funds pie concept: 50% Engineering, 25% Sales & Marketing, 15% Operations, 10% Reserve. Target close: Q2 2026. Include a CTA "Let\'s build the future of team intelligence together."',
      },
    ],
  },

  {
    id: 'presentation-product-launch',
    name: 'Product Launch',
    nameJa: '製品発表',
    descriptionJa: 'スマートホーム製品の発表プレゼンテーション。ドラマチックな演出で製品の魅力を最大限に伝える8枚構成。',
    format: '16:9',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['creative-voltage', 'neon-cyber', 'electric-studio'],
    slideCount: 8,
    tags: ['製品発表', 'ローンチ', 'スマートホーム', 'プロダクト', 'マーケティング'],
    icon: 'fa-solid fa-rocket',
    category: 'marketing',
    generationContext:
      'Smart home device "AuraSync" by fictional company "LuminaTech" - AI-powered ambient lighting system that adapts to mood, music, and circadian rhythms. Price $249, launch date 2026. Features: 16M colors, voice control, Spotify integration, sleep mode, energy saving 40%.',
    slides: [
      {
        title: 'Title - Product Reveal',
        layout: 'title',
        prompt:
          'Create a dramatic title slide for the AuraSync product launch by LuminaTech. Display "AuraSync" as the dominant heading in ultra-bold weight with a subtle glow or gradient effect suggesting ambient lighting. Tagline beneath: "Light That Understands You." Add the LuminaTech logo text in the top-left corner. Use a dark background with a vibrant color accent strip or glow emanating from the center to evoke smart lighting. Date "2026" in the bottom-right corner.',
      },
      {
        title: 'Product Hero',
        layout: 'content',
        prompt:
          'Create a Product Hero slide showcasing AuraSync. Center the slide around a large product placeholder area (represented by a glowing circular/cylindrical shape suggesting a smart light device). Surround it with 4 floating feature badges at the corners: "16M Colors" (top-left), "Voice Control" (top-right), "Spotify Sync" (bottom-left), "40% Energy Save" (bottom-right). Each badge should have a small icon and brief text. Background should have a subtle radial gradient suggesting light emanation. Price "$249" displayed prominently below the product.',
      },
      {
        title: 'The Problem',
        layout: 'content',
        prompt:
          'Create a Problem slide with headline "Your Lighting Is Stuck in the 20th Century." Present three pain points in a vertical stack with icons: 1) fa-solid fa-toggle-off - "One switch. On or off. No intelligence." 2) fa-solid fa-moon - "Harsh blue light disrupts your sleep cycle" with stat "68% of adults report screen-light insomnia." 3) fa-solid fa-plug - "Traditional bulbs waste energy on brightness you don\'t need." Use a muted, slightly dim visual tone to emphasize the "old world" feeling. High contrast text for readability.',
      },
      {
        title: 'The Solution',
        layout: 'split-half',
        prompt:
          'Create a Solution slide in split-half layout. Left side: Large heading "AuraSync Adapts to You" with three key differentiators as styled list items - "Circadian rhythm tracking adjusts warmth throughout the day," "Music-reactive mode syncs colors to Spotify beats in real-time," "AI learns your preferences and automates scenes within 7 days." Right side: A visual representation of a room transitioning through different lighting moods (morning warm gold, midday bright white, evening sunset amber, night deep blue) arranged as 4 horizontal bands or timeline.',
      },
      {
        title: 'Key Features',
        layout: 'three-column',
        prompt:
          'Create a Key Features slide with four feature cards in a 2x2 grid (or 4-column if space allows). Card 1: "16 Million Colors" - fa-solid fa-palette icon - "From subtle candlelight to vibrant party mode. Every shade, perfectly calibrated." Card 2: "Voice Control" - fa-solid fa-microphone icon - "Works with Alexa, Google Home, and Siri. Just say the mood." Card 3: "Spotify Integration" - fa-brands fa-spotify icon - "Real-time beat detection colors your room to match the music." Card 4: "Sleep Mode" - fa-solid fa-bed icon - "Gradual warm-to-dark transition follows your circadian rhythm. Fall asleep naturally." Each card: icon at top, bold title, 2-line description.',
      },
      {
        title: 'Technical Specs',
        layout: 'split-60-40',
        prompt:
          'Create a Technical Specs slide in split-60-40 layout. Left side (60%): Specs table with clean rows - Brightness: 1,100 lumens, Color Range: 16,777,216 colors, Connectivity: Wi-Fi 6 + Bluetooth 5.3, Compatibility: Alexa / Google Home / HomeKit / Spotify Connect, Dimensions: 12cm diameter x 8cm height, Weight: 340g, Lifespan: 25,000 hours, Energy Rating: A+++. Right side (40%): Three key selling stats in large format - "40% less energy than standard LED," "25,000 hr lifespan = 11 years at 6hr/day," "Setup in under 2 minutes."',
      },
      {
        title: 'Pricing & Availability',
        layout: 'content',
        prompt:
          'Create a Pricing & Availability slide. Center a large pricing card: "AuraSync" at $249 with "Early Bird: $199 (first 5,000 units)" highlighted with an accent badge. Below the price card, show three availability milestones on a horizontal timeline: "Pre-order Opens: March 2026" (fa-solid fa-cart-shopping), "Shipping Begins: June 2026" (fa-solid fa-truck-fast), "Retail Launch: September 2026" (fa-solid fa-store). Add "Free shipping worldwide" and "2-year warranty" as small trust badges at the bottom. Include bundle option: "3-Pack: $649 (Save $98)."',
      },
      {
        title: 'Call to Action',
        layout: 'title',
        prompt:
          'Create a powerful CTA slide. Large centered heading: "Light Up Your World." Below: "Pre-order now at luminatech.com/aurasync" in a prominent button-style element. Add urgency text: "Early Bird pricing ends April 30, 2026." Social proof line: "Join 12,000+ waitlist members." Footer with social icons row: @luminatech on Instagram, X, YouTube. QR code placeholder on the right side for direct link. Background should echo the dramatic lighting theme from the title slide.',
      },
    ],
  },

  {
    id: 'presentation-quarterly-report',
    name: 'Quarterly Report',
    nameJa: '四半期報告',
    descriptionJa: 'EC企業の四半期業績報告テンプレート。売上、ユーザー成長、地域分析をデータ可視化で伝える10枚構成。',
    format: '16:9',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['electric-studio', 'notebook-tabs', 'kyoto-classic'],
    slideCount: 10,
    tags: ['四半期報告', '業績', 'EC', 'データ分析', '経営会議'],
    icon: 'fa-solid fa-chart-pie',
    category: 'data',
    generationContext:
      'Fictional e-commerce company "ShopWave" Q3 2025 results. Revenue $28.4M (+18% YoY), Active users 2.1M (+32%), AOV $67.50, Net retention 118%, EBITDA margin 14.2%. Regional breakdown: APAC 45%, NA 35%, EMEA 20%. Key initiatives: mobile app relaunch, AI recommendations engine, same-day delivery pilot.',
    slides: [
      {
        title: 'Title Slide',
        layout: 'title',
        prompt:
          'Create a title slide for "ShopWave Q3 2025 Quarterly Business Review." Display the ShopWave name in bold heading with "Q3 2025 | July - September" as subtitle. Add a small upward-trending arrow icon or subtle chart motif to signal positive results. Include "Confidential - Internal Use Only" in small text at the bottom. Clean, data-oriented aesthetic. Date: October 2025.',
      },
      {
        title: 'Executive Summary',
        layout: 'content',
        prompt:
          'Create an Executive Summary slide with four KPI cards in a horizontal row at the top: Revenue $28.4M (+18% YoY) with green up arrow, Active Users 2.1M (+32% YoY) with green up arrow, AOV $67.50 (+5% QoQ) with green up arrow, EBITDA Margin 14.2% (+2.1pp YoY) with green up arrow. Below the KPI row, add a "Highlights" section with three bullet points: "Mobile app relaunch drove 40% increase in mobile conversion," "AI recommendations engine contributed 12% of total revenue," "Same-day delivery pilot launched in 3 cities with 94% satisfaction." Use sh-badge for the percentage changes.',
      },
      {
        title: 'Revenue Overview',
        layout: 'data-chart',
        prompt:
          'Create a Revenue Overview slide centered on a Chart.js bar chart showing quarterly revenue over 6 quarters. Q2 2024: $20.1M, Q3 2024: $24.1M, Q4 2024: $26.8M, Q1 2025: $25.2M, Q2 2025: $27.1M, Q3 2025: $28.4M. Highlight Q3 2025 bar in primary color, others in lighter shade. Add a trend line overlay showing upward trajectory. Below the chart, show two callout stats: "18% YoY Growth" and "$28.4M Record Quarter" in styled badges. Include y-axis in millions with dollar sign.',
      },
      {
        title: 'User Growth',
        layout: 'data-chart',
        prompt:
          'Create a User Growth slide with a Chart.js line chart showing monthly active users over 12 months (Oct 2024 to Sep 2025). Start at 1.6M, show steady growth to 2.1M with a notable acceleration after May 2025 (mobile app relaunch). Plot two lines: Total MAU (primary color, thick) and Mobile MAU (accent color, dashed) showing mobile growing from 0.8M to 1.4M. Add annotation arrow at May 2025 labeled "App Relaunch." Below chart: "67% of users now mobile-first" stat card.',
      },
      {
        title: 'Regional Performance',
        layout: 'split-60-40',
        prompt:
          'Create a Regional Performance slide in split-60-40 layout. Left side (60%): Chart.js doughnut chart showing revenue by region - APAC 45% ($12.8M), NA 35% ($9.9M), EMEA 20% ($5.7M). Use three distinct colors. Right side (40%): Three region cards stacked vertically. APAC: $12.8M, +24% YoY, "Japan and Korea drove growth." NA: $9.9M, +12% YoY, "US market stabilizing." EMEA: $5.7M, +15% YoY, "UK expansion on track." Each card shows the flag emoji region indicator, revenue, and growth rate.',
      },
      {
        title: 'Key Metrics Dashboard',
        layout: 'three-column',
        prompt:
          'Create a Key Metrics Dashboard slide with six metric cards in a 3x2 grid. Row 1: Gross Margin 62.4% (target: 60%, green status), Customer Acquisition Cost $18.50 (down 12%, green), Conversion Rate 3.8% (up 0.4pp, green). Row 2: Net Revenue Retention 118% (target: 115%, green), Cart Abandonment 64% (down 3pp, amber), Average Session Duration 8.2min (up 15%, green). Each card: metric name, large number, trend indicator (arrow + percentage), and status dot (green/amber/red). Use a dashboard grid aesthetic with subtle borders.',
      },
      {
        title: 'Product Highlights',
        layout: 'two-column',
        prompt:
          'Create a Product Highlights slide in two-column layout. Left column "Launched": Three shipped features as cards with green checkmarks - 1) "AI Recommendations Engine - 12% revenue attribution, 3.2x click-through vs manual curation." 2) "Mobile App v3.0 - 4.8 star rating, 40% conversion uplift." 3) "Same-Day Delivery Pilot - 3 cities, 94% CSAT, 22% basket size increase." Right column "In Progress": Three upcoming features with progress bars - 1) "Social Commerce Integration (75% complete, Q4 target)." 2) "AR Try-On for Fashion (40% complete, Q1 2026)." 3) "Loyalty Program Redesign (60% complete, Q4 target)."',
      },
      {
        title: 'Challenges & Risks',
        layout: 'content',
        prompt:
          'Create a Challenges & Risks slide with three risk cards in a horizontal row. Card 1 (Red/High): "Supply Chain Delays" - fa-solid fa-truck icon - "APAC logistics partner capacity constraints. Lead times up 18%. Mitigation: onboarding 2 backup carriers by November." Card 2 (Amber/Medium): "Rising CAC in NA" - fa-solid fa-dollar-sign icon - "Meta CPM up 22% in Q3. Mitigation: shifting 30% of paid budget to TikTok and organic content." Card 3 (Amber/Medium): "Talent Retention" - fa-solid fa-users icon - "Engineering attrition at 15% annualized. Mitigation: equity refresh program approved, launching Q4." Use color-coded severity indicators.',
      },
      {
        title: 'Q4 Outlook',
        layout: 'two-column',
        prompt:
          'Create a Q4 Outlook slide in two-column layout. Left column "Targets": Four target metrics in styled cards - Revenue: $32M (+12% QoQ), Active Users: 2.4M, EBITDA Margin: 16%, Mobile Share: 72%. Each with a target icon and progress-toward-target indicator. Right column "Key Initiatives": Numbered list of Q4 priorities - 1) "Black Friday / Cyber Monday campaign ($5M target)." 2) "Social commerce beta launch in Japan." 3) "Same-day delivery expansion to 8 cities." 4) "Loyalty program 2.0 rollout." 5) "Series C preparation (target: $80M at $600M valuation)."',
      },
      {
        title: 'Appendix',
        layout: 'content',
        prompt:
          'Create an Appendix slide with a detailed financial summary table. Columns: Metric, Q3 2025, Q2 2025, Q3 2024, YoY Change. Rows: Revenue ($28.4M, $27.1M, $24.1M, +18%), Gross Profit ($17.7M, $16.8M, $14.5M, +22%), EBITDA ($4.0M, $3.5M, $2.9M, +38%), Active Users (2.1M, 1.9M, 1.6M, +32%), Orders (421K, 398K, 352K, +20%), AOV ($67.50, $68.10, $68.40, -1%). Clean table with alternating row shading. Add "Contact: finance@shopwave.com" at the bottom.',
      },
    ],
  },

  {
    id: 'presentation-workshop',
    name: 'Workshop',
    nameJa: 'ワークショップ',
    descriptionJa: 'デザインシンキングワークショップ用テンプレート。演習指示やケーススタディを含む実践的な8枚構成。',
    format: '16:9',
    suggestedStylePreset: 'pastel-geometry',
    alternativeStylePresets: ['split-pastel', 'notebook-tabs', 'electric-studio'],
    slideCount: 8,
    tags: ['ワークショップ', 'デザインシンキング', '教育', '研修', 'ファシリテーション'],
    icon: 'fa-solid fa-chalkboard-user',
    category: 'education',
    generationContext:
      '"Design Thinking Masterclass" workshop for product managers. Duration: 3 hours. Covers 5 phases (Empathize, Define, Ideate, Prototype, Test) with hands-on exercises. Include real case study of Airbnb\'s design thinking process. Target: 20 participants.',
    slides: [
      {
        title: 'Title & Agenda',
        layout: 'split-60-40',
        prompt:
          'Create a welcoming title slide for "Design Thinking Masterclass" in split-60-40 layout. Left side (60%): Large heading "Design Thinking Masterclass" with subtitle "From Empathy to Innovation in 3 Hours." Add facilitator info "For Product Managers | 20 Participants." Right side (40%): Agenda timeline as a vertical list - "09:00 Introduction & Warm-up (15min)," "09:15 Empathize & Define (45min)," "10:00 Ideate Workshop (40min)," "10:40 Break (10min)," "10:50 Prototype & Test (50min)," "11:40 Case Study & Wrap-up (20min)." Use a friendly, approachable design with geometric shapes.',
      },
      {
        title: 'What is Design Thinking',
        layout: 'content',
        prompt:
          'Create an overview slide explaining Design Thinking. Heading: "What is Design Thinking?" Show the 5-phase process as a horizontal flow diagram with connected circles or hexagons: 1) Empathize (fa-solid fa-heart, pink), 2) Define (fa-solid fa-crosshairs, blue), 3) Ideate (fa-solid fa-lightbulb, yellow), 4) Prototype (fa-solid fa-cubes, green), 5) Test (fa-solid fa-flask, purple). Below the diagram, add a quote: "Design thinking is a human-centered approach to innovation that draws from the designer\'s toolkit." - Tim Brown, IDEO. Note the non-linear nature with a small looping arrow between Test and Empathize.',
      },
      {
        title: 'Empathize & Define',
        layout: 'two-column',
        prompt:
          'Create a slide covering Phase 1 (Empathize) and Phase 2 (Define) in two-column layout. Left column "Phase 1: Empathize" with fa-solid fa-heart icon: Key activities listed - "User interviews," "Observation & shadowing," "Journey mapping," "Empathy mapping." Tool highlight: "Empathy Map Canvas: What users Say, Think, Do, Feel." Add exercise callout: "Exercise (15min): Interview your partner about their worst product experience." Right column "Phase 2: Define" with fa-solid fa-crosshairs icon: Key activities - "Synthesize research," "Identify patterns," "Create Point of View statement." Template: "POV: [User] needs [need] because [insight]." Exercise: "Exercise (10min): Write a POV statement from your interview."',
      },
      {
        title: 'Ideate Workshop',
        layout: 'content',
        prompt:
          'Create an Ideate phase slide with workshop instructions. Heading: "Phase 3: Ideate - Quantity Over Quality." Show three ideation techniques as large cards: 1) "Crazy 8s" - fa-solid fa-clock icon - "8 sketches in 8 minutes. One idea per panel. No erasing. Go wild." 2) "How Might We" - fa-solid fa-question icon - "Reframe problems as opportunities. HMW reduce onboarding friction for new users?" 3) "Dot Voting" - fa-solid fa-circle icon - "Each person gets 3 dots. Vote on the most promising ideas." Include ground rules in a highlighted box: "No criticism during ideation. Build on others\' ideas. Encourage wild ideas. Go for quantity."',
      },
      {
        title: 'Prototype & Test',
        layout: 'two-column',
        prompt:
          'Create a slide covering Phase 4 (Prototype) and Phase 5 (Test) in two-column layout. Left column "Phase 4: Prototype" with fa-solid fa-cubes icon: "Build to think, not to ship." Prototype types ranked by fidelity: Paper sketches (5min), Clickable wireframes (30min), Landing page (2hr), Interactive prototype (1-2 days). Exercise: "Exercise (20min): Build a paper prototype of your top-voted idea. Use the supplies provided: paper, markers, sticky notes, tape." Right column "Phase 5: Test" with fa-solid fa-flask icon: "Test with real users, not colleagues." Testing protocol: "1) Set context, not expectations. 2) Give tasks, not tours. 3) Observe, don\'t lead. 4) Ask why, not what." Exercise: "Exercise (15min): Test your prototype with another team. Document 3 key learnings."',
      },
      {
        title: 'Case Study: Airbnb',
        layout: 'content',
        prompt:
          'Create a Case Study slide about Airbnb\'s design thinking journey. Heading: "Case Study: How Design Thinking Saved Airbnb." Timeline format showing the story: "2009 - Revenue flatlined at $200/week. Founders near bankruptcy." Then "The Insight: Bad listing photos were killing trust." Apply the 5 phases to Airbnb: "Empathize: Visited NYC hosts, saw the gap between reality and photos. Define: Hosts lacked tools to present their spaces professionally. Ideate: What if we photograph every listing ourselves? Prototype: Rented a camera, shot 40 listings in NYC. Test: Revenue doubled in one week." Closing stat: "From near-death to $100B+ valuation." Use a storytelling visual flow.',
      },
      {
        title: 'Hands-on Exercise Brief',
        layout: 'content',
        prompt:
          'Create a comprehensive exercise brief slide. Heading: "Final Exercise: End-to-End Design Sprint (40 minutes)." Challenge statement in a prominent box: "Redesign the conference registration experience for first-time attendees." Timeline: "Minutes 0-8: Empathize (interview a partner who attended a conference)," "Minutes 8-13: Define (write HMW statement)," "Minutes 13-23: Ideate (Crazy 8s + dot vote)," "Minutes 23-35: Prototype (paper prototype)," "Minutes 35-40: Test (swap with another team)." Deliverables checklist: Empathy map, POV statement, 8 sketches, 1 paper prototype, 3 test learnings. Add team formation note: "Form groups of 4. Mix departments."',
      },
      {
        title: 'Key Takeaways & Resources',
        layout: 'two-column',
        prompt:
          'Create a closing slide with key takeaways and resources in two-column layout. Left column "Key Takeaways": 5 numbered items with icons - 1) "Start with empathy, always" (fa-solid fa-heart), 2) "Diverge before you converge" (fa-solid fa-arrows-left-right), 3) "Fail fast, learn faster" (fa-solid fa-bolt), 4) "Prototype everything" (fa-solid fa-cubes), 5) "Test with real users" (fa-solid fa-users). Right column "Resources": Book recommendations - "The Design of Everyday Things - Don Norman," "Sprint - Jake Knapp," "Creative Confidence - Tom & David Kelley." Online: "IDEO U courses, Stanford d.school resources." Add a feedback QR code placeholder and facilitator contact info.',
      },
    ],
  },

  {
    id: 'presentation-investor-pitch',
    name: 'Investor Pitch',
    nameJa: '投資家ピッチ',
    descriptionJa: 'Series A資金調達用ピッチデック。物流×AIスタートアップのトラクション、財務予測、チーム紹介を含む12枚構成。',
    format: '16:9',
    suggestedStylePreset: 'creative-voltage',
    alternativeStylePresets: ['bold-signal', 'electric-studio', 'neon-cyber'],
    slideCount: 12,
    tags: ['ピッチデッキ', '資金調達', 'Series A', '投資家', 'スタートアップ'],
    icon: 'fa-solid fa-hand-holding-dollar',
    category: 'business',
    generationContext:
      'Series A pitch for "GreenRoute" - AI-powered logistics optimization reducing carbon emissions by 30% and costs by 22%. Founded 2024, seed $3M from Sequoia Scout. Current: 47 enterprise clients, $4.2M ARR, 15% MoM growth. Asking: $20M Series A at $80M pre-money. Team of 12, patents filed for route optimization algorithm.',
    slides: [
      {
        title: 'Title Slide',
        layout: 'title',
        prompt:
          'Create a bold title slide for "GreenRoute" investor pitch. Display "GreenRoute" in large bold heading with a leaf-integrated logo concept (stylized route/path with green leaf). Tagline: "AI-Powered Logistics. 30% Less Carbon. 22% Lower Costs." Add "Series A | $20M Raise" in a subtle accent badge. Dark background with green gradient accents suggesting sustainability and technology. Confident, forward-looking energy.',
      },
      {
        title: 'The Problem',
        layout: 'content',
        prompt:
          'Create a Problem slide with headline: "Logistics Is Killing the Planet - and Profits." Three shocking statistics displayed as large-format number cards: 1) "8%" - "of global CO2 emissions come from freight transport" (fa-solid fa-truck), 2) "$1.85T" - "wasted annually on inefficient routing" (fa-solid fa-route), 3) "40%" - "of delivery trucks run partially empty" (fa-solid fa-box-open). Below the stats, add a human element: "Supply chain managers juggle 50+ variables manually. The result: wasted fuel, missed windows, and unsustainable operations." Use impactful data visualization with a dark, serious tone.',
      },
      {
        title: 'The Solution',
        layout: 'split-60-40',
        prompt:
          'Create a Solution slide in split-60-40 layout. Left side (60%): Heading "GreenRoute: The Brain of Sustainable Logistics." Description: "Our AI engine processes 200+ real-time variables - traffic, weather, vehicle capacity, delivery windows, carbon constraints - to generate optimal routes that minimize both cost and emissions simultaneously." Three key outcomes as styled badges: "30% emission reduction," "22% cost savings," "18% faster delivery times." Right side (40%): Simplified visual showing a before/after route comparison - chaotic crossing lines (before) vs clean optimized paths (after) with a green efficiency indicator.',
      },
      {
        title: 'How It Works',
        layout: 'three-column',
        prompt:
          'Create a How It Works slide with three steps in columns. Step 1 "Connect" (fa-solid fa-plug icon): "Integrate with existing TMS, WMS, and ERP systems via our API. 15-minute setup with pre-built connectors for SAP, Oracle, and 40+ platforms. Zero disruption to current workflows." Step 2 "Optimize" (fa-solid fa-microchip icon): "Our patented ML algorithm processes fleet data, constraints, and real-time conditions. Generates optimized routes in under 3 seconds for fleets of 10,000+ vehicles." Step 3 "Measure" (fa-solid fa-chart-line icon): "Real-time dashboard tracks carbon saved, cost reduced, and delivery performance. Automated ESG reporting for compliance. Monthly sustainability scorecards." Number each step with a large circled numeral.',
      },
      {
        title: 'Market Size',
        layout: 'content',
        prompt:
          'Create a Market Size slide showing a layered market diagram. TAM: $180B - "Global logistics optimization & fleet management software." SAM: $32B - "AI-powered route optimization for enterprise fleets." SOM: $4.8B - "Mid-to-large enterprises in NA and EMEA with 100+ vehicle fleets." Display as concentric circles or a triangle funnel. Add supporting data: "Market CAGR: 24% (2024-2030). Driven by: ESG mandates, fuel cost pressure, driver shortages." Source: "McKinsey Global Logistics Report 2025, Gartner." Emphasize the green/sustainability tailwind.',
      },
      {
        title: 'Traction & Metrics',
        layout: 'data-chart',
        prompt:
          'Create a Traction slide with a Chart.js chart showing MRR growth over 12 months. Start at $80K (Oct 2024) and grow to $350K (Sep 2025), showing 15% MoM growth. Use a filled area chart with gradient. Alongside the chart, display four key metrics in styled cards: "47 Enterprise Clients" (fa-solid fa-building), "$4.2M ARR" (fa-solid fa-dollar-sign), "15% MoM Growth" (fa-solid fa-arrow-trend-up), "Net Revenue Retention: 135%" (fa-solid fa-rotate). Add notable logos placeholder: "Trusted by logistics leaders across 8 countries." Show hockey-stick trajectory clearly.',
      },
      {
        title: 'Business Model',
        layout: 'two-column',
        prompt:
          'Create a Business Model slide in two-column layout. Left column "Pricing Tiers": Three tier cards - Growth ($2K/mo, up to 200 vehicles, core optimization), Scale ($8K/mo, up to 2,000 vehicles, AI + ESG reporting), Enterprise (Custom, unlimited vehicles, dedicated support, custom integrations). Average contract value: $96K/year. Right column "Unit Economics": Key metrics in vertical cards - Gross Margin: 82%, CAC: $15K, LTV: $288K, LTV:CAC: 19:1, Payback: 3.2 months, Net Dollar Retention: 135%. Highlight the strong unit economics with green positive indicators.',
      },
      {
        title: 'Competitive Landscape',
        layout: 'content',
        prompt:
          'Create a Competitive Landscape slide with a 2x2 matrix positioning chart. X-axis: "Route Optimization Depth" (low to high). Y-axis: "Carbon Intelligence" (low to high). Position competitors: Bottom-left: "Legacy TMS (SAP, Oracle)" - basic routing, no carbon. Bottom-right: "Route4Me, OptimoRoute" - good routing, no carbon focus. Top-left: "Persefoni, Watershed" - carbon measurement only, no routing. Top-right (highlighted): "GreenRoute" - best of both. Add a brief table below: GreenRoute vs top 2 competitors on key dimensions: Real-time AI (Yes/Partial/No), Carbon optimization (Yes/No/No), Integration speed (15min/2wks/4wks), Fleet scale (10K+/5K/2K).',
      },
      {
        title: 'Go-to-Market',
        layout: 'content',
        prompt:
          'Create a Go-to-Market strategy slide. Heading: "Land & Expand in the Enterprise." Three-phase GTM displayed as a horizontal timeline or roadmap: Phase 1 "Land" (Now): "Direct sales to mid-market logistics companies (200-2,000 vehicles). Focus: NA and UK. Channel: outbound sales + industry events. Current: 3 SDRs + 2 AEs." Phase 2 "Expand" (2026): "Upsell to enterprise ($8K+ plans). Geographic expansion to DACH and Nordics. Launch partner channel with Big 4 consulting firms." Phase 3 "Platform" (2027): "Open API marketplace for third-party integrations. Carbon credit trading platform. Become the logistics sustainability OS." Add target metrics per phase.',
      },
      {
        title: 'Financial Projections',
        layout: 'data-chart',
        prompt:
          'Create a Financial Projections slide with a Chart.js grouped bar chart showing 4-year forecast. ARR: 2025 $4.2M, 2026 $14M, 2027 $38M, 2028 $82M. Gross Profit bars alongside (at 82% margin): $3.4M, $11.5M, $31.2M, $67.2M. Add a line for operating margin: -40%, -8%, 15%, 28%. Below the chart, show path to profitability: "Cash flow positive by Q3 2027. $82M ARR by 2028 with 28% operating margin." Key assumptions in small text: "15% MoM growth sustaining, 135% NRR, $96K ACV."',
      },
      {
        title: 'The Team',
        layout: 'content',
        prompt:
          'Create a Team slide with a clean grid of team profiles. Highlight 4 key leaders: 1) "Alex Rivera, CEO" - ex-McKinsey Supply Chain Practice, MIT MBA, 15 years in logistics. 2) "Dr. Priya Sharma, CTO" - ex-DeepMind, PhD in Combinatorial Optimization, 3 patents. 3) "Marcus Webb, VP Sales" - ex-Samsara, built $0-$50M ARR, enterprise SaaS veteran. 4) "Dr. Lin Zhang, Head of AI" - ex-Google Brain, published 28 papers on route optimization. Below the 4 leaders: "12 team members across engineering (7), sales (3), and operations (2). Advisory board includes former CEO of DHL Express and VP of Sustainability at Maersk." Each profile: name, title, one-line credential, small avatar placeholder.',
      },
      {
        title: 'The Ask',
        layout: 'content',
        prompt:
          'Create a closing Ask slide. Large centered heading: "Raising $20M Series A." Valuation: "$80M pre-money." Below, show use of funds as a horizontal stacked bar or pie: Engineering & Product 50% ($10M) - "Scale AI engine, build platform features." Sales & Marketing 30% ($6M) - "Expand team to 15 reps, enter 3 new markets." Operations & Compliance 15% ($3M) - "SOC 2, ISO 27001, carbon methodology certification." Reserve 5% ($1M). Key milestones this round will achieve: "$14M ARR by end of 2026," "150+ enterprise clients," "3 new geographic markets," "Path to Series B at $300M+ valuation." Final line: "Let\'s decarbonize logistics together." Contact: invest@greenroute.ai.',
      },
    ],
  },

  // ==========================================================================
  // INSTAGRAM POST (4:5) - 5 templates
  // ==========================================================================

  {
    id: 'instagram-post-product-announcement',
    name: 'Product Announcement',
    nameJa: '新商品告知',
    descriptionJa: 'プレミアムワイヤレスイヤホンの新商品告知デザイン。製品を中心にした洗練されたビジュアル。',
    format: 'instagram-post',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['electric-studio', 'neon-cyber', 'swiss-modern'],
    slideCount: 1,
    tags: ['新商品', '製品発表', 'イヤホン', 'ガジェット', 'SNS投稿'],
    icon: 'fa-solid fa-bullhorn',
    category: 'marketing',
    generationContext:
      'Premium wireless earbuds "SonicPure X1" by "AudioCraft". Price 24,800 yen. Features: 45hr battery, ANC, spatial audio, IPX5. Launch campaign visual. Design: product-centric, bold typography, minimal text (max 15 words on design).',
    slides: [
      {
        title: 'Product Announcement',
        layout: 'single-design',
        prompt:
          'Create a premium product announcement post for "SonicPure X1" wireless earbuds by AudioCraft. Center the design around a product placeholder area (sleek circular earbuds shape) on a dark background with dramatic lighting effect from below. Large bold heading "SonicPure X1" at the top in ultra-bold weight. Below the product area, display "NEW RELEASE" as an accent badge. Four micro feature icons in a horizontal row at the bottom: battery icon "45hr", shield icon "ANC", audio-wave icon "Spatial", water-drop icon "IPX5". Price "24,800 yen" in clean typography near the bottom. Brand name "AudioCraft" small in the corner. Total visible text must not exceed 15 words. Use high contrast, premium feel.',
      },
    ],
  },

  {
    id: 'instagram-post-sale-promotion',
    name: 'Sale Promotion',
    nameJa: 'セール告知',
    descriptionJa: 'ファッションブランドのサマーセール告知。大胆なディスカウント表示とエネルギッシュなレイアウト。',
    format: 'instagram-post',
    suggestedStylePreset: 'creative-voltage',
    alternativeStylePresets: ['bold-signal', 'neon-cyber', 'split-pastel'],
    slideCount: 1,
    tags: ['セール', '割引', 'ファッション', 'キャンペーン', 'SNS投稿'],
    icon: 'fa-solid fa-tags',
    category: 'marketing',
    generationContext:
      'Summer sale for fictional fashion brand "VERTE". Up to 70% OFF, June 1-30. Highlight categories: dresses, accessories, swimwear. Use energetic layout with large discount numbers. Brand colors: emerald green + gold. Max 10 words on design.',
    slides: [
      {
        title: 'Sale Promotion',
        layout: 'single-design',
        prompt:
          'Create an energetic summer sale post for fashion brand "VERTE". Design must be dominated by a massive "70%" in ultra-bold weight (300px+ equivalent) taking up roughly 40% of the canvas, with "UP TO" in smaller text above and "OFF" after. Use emerald green (#10B981) as the primary color with gold (#D4AF37) accents. Add "SUMMER SALE" as a secondary heading. Period "June 1 - 30" in a clean badge element. Three small category tags at the bottom: "Dresses", "Accessories", "Swimwear". Brand name "VERTE" in the top corner. Background should have dynamic diagonal shapes or geometric patterns in green/gold palette. Total text must not exceed 10 words. Energy and urgency should radiate from the design.',
      },
    ],
  },

  {
    id: 'instagram-post-quote',
    name: 'Motivational Quote',
    nameJa: '格言・モチベーション',
    descriptionJa: '名言を美しいタイポグラフィで表現するデザイン。ダーク&ボタニカルなムードで印象的に。',
    format: 'instagram-post',
    suggestedStylePreset: 'dark-botanical',
    alternativeStylePresets: ['kyoto-classic', 'vintage-editorial', 'notebook-tabs'],
    slideCount: 1,
    tags: ['格言', '名言', 'モチベーション', 'タイポグラフィ', 'SNS投稿'],
    icon: 'fa-solid fa-quote-left',
    category: 'creative',
    generationContext:
      'Motivational quote design. Quote: "The only way to do great work is to love what you do." - Steve Jobs. Elegant typography-first design with botanical/nature aesthetic. Dark moody background with subtle organic shapes. Centered text hierarchy.',
    slides: [
      {
        title: 'Quote Card',
        layout: 'single-design',
        prompt:
          'Create an elegant motivational quote card with a dark moody aesthetic. Background: deep dark color (#1A1A2E) with very subtle botanical line-art elements (fern fronds, leaves) in slightly lighter shade as decorative accents in the corners and edges. Center the quote with generous padding: opening quotation mark as a large decorative element in gold/warm accent color. Quote text "The only way to do great work is to love what you do." in serif font, centered, with emphasis on "great work" and "love" through slightly larger size or accent color. Attribution "- Steve Jobs" below in smaller, spaced-out uppercase. Add thin decorative divider lines above and below the attribution. Overall feel: contemplative, premium, timeless. No images, pure typography and subtle botanical line art.',
      },
    ],
  },

  {
    id: 'instagram-post-event',
    name: 'Event Announcement',
    nameJa: 'イベント告知',
    descriptionJa: 'テックカンファレンスのイベント告知デザイン。日程と会場を目立たせるクリーンなレイアウト。',
    format: 'instagram-post',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['swiss-modern', 'creative-voltage', 'neon-cyber'],
    slideCount: 1,
    tags: ['イベント', 'カンファレンス', 'テック', '告知', 'SNS投稿'],
    icon: 'fa-solid fa-calendar-days',
    category: 'marketing',
    generationContext:
      'Tech conference "DevConnect Tokyo 2026" at Shibuya Hikarie. Date: September 15-16. Speakers: 30+, Workshops: 12, Networking events. Early bird 15,000 yen (regular 25,000 yen). Clean, modern tech event visual with date prominently displayed.',
    slides: [
      {
        title: 'Event Announcement',
        layout: 'single-design',
        prompt:
          'Create a clean, modern tech event announcement post for "DevConnect Tokyo 2026." Top section: Event name "DevConnect" in bold heading with "Tokyo 2026" on the next line. Date prominently displayed in a large accent-colored block: "SEPT 15-16" in bold numbers. Venue: "Shibuya Hikarie" with a small location pin icon. Middle section: Three stat badges in a horizontal row - "30+ Speakers", "12 Workshops", "Networking". Bottom section: Early bird pricing card "Early Bird 15,000 yen" with strikethrough "Regular 25,000 yen". Small "Register Now" CTA element. Use blue primary color with clean white/light background. Tech-inspired subtle grid pattern in the background. Professional, aspirational tone.',
      },
    ],
  },

  {
    id: 'instagram-post-before-after',
    name: 'Before/After',
    nameJa: 'Before/After',
    descriptionJa: 'インテリアデザインのBefore/After比較ビジュアル。劇的な変化をスプリットレイアウトで表現。',
    format: 'instagram-post',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['electric-studio', 'pastel-geometry', 'notebook-tabs'],
    slideCount: 1,
    tags: ['Before/After', 'インテリア', 'リノベーション', '比較', 'SNS投稿'],
    icon: 'fa-solid fa-arrows-left-right',
    category: 'creative',
    generationContext:
      'Interior design before/after showcase for fictional studio "MUJI Living Lab". Living room transformation: cluttered to minimalist Japanese modern. Split composition showing dramatic transformation. Clean divider between before/after sides.',
    slides: [
      {
        title: 'Before/After Comparison',
        layout: 'single-design',
        prompt:
          'Create a before/after comparison post for "MUJI Living Lab" interior design studio. Split the canvas vertically into two equal halves with a clean white divider line (3px) down the center. Left half "BEFORE": Use a muted, slightly desaturated warm tone as background. Show design elements suggesting clutter - overlapping shapes, mismatched patterns, dense arrangement of rectangular furniture shapes. Label "BEFORE" at the top-left in bold text. Right half "AFTER": Use a clean, bright, airy background. Show minimal, organized shapes - a low sofa line, single plant element, open space. Label "AFTER" at the top-right in bold text. Center arrow icon on the divider pointing right. Brand name "MUJI Living Lab" at the bottom center spanning both halves. Add "Living Room Transformation" as a small subtitle. Overall composition should make the contrast immediately obvious at thumbnail size.',
      },
    ],
  },

  // ==========================================================================
  // INSTAGRAM STORY (9:16) - 5 templates
  // ==========================================================================

  {
    id: 'instagram-story-product-release',
    name: 'Product Release Story',
    nameJa: '新商品リリース',
    descriptionJa: '限定スニーカーの新作リリースストーリー。サイバー/フューチャリスティックなデザインで注目を集める。',
    format: 'instagram-story',
    suggestedStylePreset: 'neon-cyber',
    alternativeStylePresets: ['bold-signal', 'creative-voltage', 'electric-studio'],
    slideCount: 1,
    tags: ['新商品', 'リリース', 'スニーカー', '限定', 'ストーリー'],
    icon: 'fa-solid fa-shoe-prints',
    category: 'marketing',
    generationContext:
      'Limited edition sneaker drop "NeonStride V3" by "UrbanKicks". Price $189, only 500 pairs. Cyber/futuristic aesthetic. Features: reactive LED sole, recycled materials, NFC chip. Full-screen immersive design with neon accents. Swipe up CTA.',
    slides: [
      {
        title: 'Product Release Story',
        layout: 'single-design',
        prompt:
          'Create an immersive full-screen story for "NeonStride V3" limited sneaker drop by UrbanKicks. Dark background (#0A0A0F) with vibrant neon glow effects. Top area: "UrbanKicks" brand name in small text, then "LIMITED DROP" badge with pulsing glow effect. Center: Large product placeholder area - sneaker silhouette shape with neon cyan (#00F0FF) and magenta (#FF00E5) glow outlines. Product name "NEONSTRIDE V3" in ultra-bold heading below the product. Feature row: three neon-bordered micro cards - "LED Sole", "Recycled", "NFC Chip". Lower section: "$189" price and "ONLY 500 PAIRS" in urgent red/neon text. Bottom: "SWIPE UP" CTA with upward arrow animation suggestion. Use scan-line or grid texture overlay for cyber feel.',
      },
    ],
  },

  {
    id: 'instagram-story-countdown',
    name: 'Countdown Story',
    nameJa: 'カウントダウン',
    descriptionJa: 'アプリローンチのカウントダウンストーリー。大きな数字とエネルギッシュなデザインで期待感を演出。',
    format: 'instagram-story',
    suggestedStylePreset: 'creative-voltage',
    alternativeStylePresets: ['bold-signal', 'neon-cyber', 'electric-studio'],
    slideCount: 1,
    tags: ['カウントダウン', 'ローンチ', 'アプリ', 'ティザー', 'ストーリー'],
    icon: 'fa-solid fa-hourglass-half',
    category: 'marketing',
    generationContext:
      'App launch countdown for "FocusFlow" - productivity app. "3 DAYS LEFT" countdown visual. Features teased: AI task prioritization, focus timer, team sync. Bold numbers, energetic layout. Include "Notify Me" CTA.',
    slides: [
      {
        title: 'Countdown Story',
        layout: 'single-design',
        prompt:
          'Create an energetic countdown story for "FocusFlow" productivity app launch. Dark gradient background from deep navy to dark purple. Top: "FocusFlow" logo text with a small lightning bolt icon. Center dominant element: massive "3" number in ultra-bold (500px+ equivalent) with gradient fill from pink (#F43F5E) to purple (#8B5CF6). "DAYS LEFT" in bold uppercase directly below the number. Add subtle radiating lines or burst effect behind the number for energy. Middle section: Three teaser feature pills in a vertical stack - "AI Task Prioritization", "Focus Timer", "Team Sync" - each with a small lock icon suggesting they will be revealed. Bottom area: "NOTIFY ME" CTA button element in accent color with a bell icon (fa-solid fa-bell). Small text: "Launching February 15, 2026." Overall energy: exciting, building anticipation, dynamic.',
      },
    ],
  },

  {
    id: 'instagram-story-poll',
    name: 'Poll Story',
    nameJa: 'アンケート',
    descriptionJa: 'コーヒーブランドのアンケートストーリー。A/B選択を楽しいスプリットデザインで表現。',
    format: 'instagram-story',
    suggestedStylePreset: 'split-pastel',
    alternativeStylePresets: ['pastel-geometry', 'creative-voltage', 'notebook-tabs'],
    slideCount: 1,
    tags: ['アンケート', 'ポール', 'コーヒー', 'インタラクティブ', 'ストーリー'],
    icon: 'fa-solid fa-square-poll-horizontal',
    category: 'marketing',
    generationContext:
      'Coffee brand "Morning Ritual" poll: "Your morning pick?" Option A: Iced Latte vs Option B: Hot Espresso. Playful split design with two distinct color zones. Fun, casual aesthetic. Interactive feel with clear A/B sections.',
    slides: [
      {
        title: 'Poll Story',
        layout: 'single-design',
        prompt:
          'Create a playful poll story for coffee brand "Morning Ritual". Split the full canvas into two halves with a zigzag or wavy divider. Left half (cool tones - light blue #DBEAFE background): Large iced coffee cup illustration area at center, "ICED LATTE" in bold fun typography, "A" in a large circle badge at the top-left corner, snowflake icon for cold emphasis. Right half (warm tones - light peach #FED7AA background): Large espresso cup illustration area at center, "HOT ESPRESSO" in bold fun typography, "B" in a large circle badge at the top-right corner, flame icon for hot emphasis. Top center spanning both halves: "Morning Ritual" brand name and question "Your morning pick?" in a playful font. Bottom center: "TAP TO VOTE" text with hand-tap icon. Overall feel: fun, casual, inviting engagement. Pastel palette, rounded elements.',
      },
    ],
  },

  {
    id: 'instagram-story-announcement',
    name: 'Announcement Story',
    nameJa: 'お知らせ',
    descriptionJa: 'レストランの新メニュー告知ストーリー。季節感と食欲を刺激するデザイン。',
    format: 'instagram-story',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['creative-voltage', 'vintage-editorial', 'kyoto-classic'],
    slideCount: 1,
    tags: ['お知らせ', 'レストラン', '新メニュー', '季節限定', 'ストーリー'],
    icon: 'fa-solid fa-utensils',
    category: 'marketing',
    generationContext:
      'Restaurant "Sakura Kitchen" announcement: New menu launch for Spring 2026. 5 new seasonal dishes featuring cherry blossom themes. Opening special: 20% off first week. Bold, appetizing design with clean typography.',
    slides: [
      {
        title: 'Announcement Story',
        layout: 'single-design',
        prompt:
          'Create a bold announcement story for restaurant "Sakura Kitchen" new spring menu. Dark dramatic background with a warm spotlight effect from center. Top section: "Sakura Kitchen" in elegant serif-style heading with a small cherry blossom decorative element. "NEW MENU" displayed in a large bold accent badge in red/coral. Center area: "Spring 2026" in large flowing typography with sakura petal decorative elements scattered around. Highlight text: "5 New Seasonal Dishes" with a cherry blossom branch illustration accent. Lower section: "OPENING SPECIAL" badge followed by "20% OFF First Week" in bold contrasting text. Period "March 1-7" below. Bottom: "Reserve Now" CTA button element. Small address or location hint. Overall mood: premium dining, seasonal freshness, urgency to visit.',
      },
    ],
  },

  {
    id: 'instagram-story-tutorial',
    name: 'Tutorial Story',
    nameJa: 'チュートリアル',
    descriptionJa: 'ラテアート3ステップチュートリアルストーリー。教育的かつビジュアルに訴えるデザイン。',
    format: 'instagram-story',
    suggestedStylePreset: 'pastel-geometry',
    alternativeStylePresets: ['split-pastel', 'notebook-tabs', 'electric-studio'],
    slideCount: 1,
    tags: ['チュートリアル', 'ハウツー', 'コーヒー', 'ラテアート', 'ストーリー'],
    icon: 'fa-solid fa-graduation-cap',
    category: 'education',
    generationContext:
      'Quick tutorial: "3 Steps to Perfect Latte Art" by "Brew Academy". Step 1: Steam milk to 65 degrees C. Step 2: Pour from center. Step 3: Wrist flick for pattern. Clean, numbered step layout. Educational but visually appealing.',
    slides: [
      {
        title: 'Tutorial Story',
        layout: 'single-design',
        prompt:
          'Create a clean, educational tutorial story for "3 Steps to Perfect Latte Art" by Brew Academy. Light pastel background (#F7F7FF) with subtle geometric shapes. Top section: "Brew Academy" brand name in small text, then "LATTE ART" in large bold heading with a coffee cup icon, subtitle "in 3 Easy Steps." Three step cards stacked vertically with generous spacing, each with: a large circled number (1, 2, 3) in the primary accent color, a bold step title, and a brief instruction. Step 1: "Steam the Milk" - "Heat to 65 degrees C. Look for a glossy, paint-like texture with micro-foam." Step 2: "Pour from Center" - "Hold cup at 45 degrees. Pour steadily from 3cm above the surface." Step 3: "Wrist Flick" - "When cup is 2/3 full, bring pitcher close and flick wrist side-to-side for the pattern." Each card should have a subtle divider or different background shade. Bottom: "Save this for later" with a bookmark icon. Friendly, approachable aesthetic with geometric accents.',
      },
    ],
  },

  // ==========================================================================
  // YOUTUBE THUMBNAIL (1280x720) - 5 templates
  // ==========================================================================

  {
    id: 'youtube-thumbnail-how-to',
    name: 'How-To Thumbnail',
    nameJa: 'ハウツー',
    descriptionJa: 'ハウツー動画用サムネイル。超太字テキストと矢印要素で視聴者の注目を集めるデザイン。',
    format: 'youtube-thumbnail',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['bold-signal', 'swiss-modern', 'creative-voltage'],
    slideCount: 1,
    tags: ['ハウツー', 'サムネイル', '副業', 'ビジネス', 'YouTube'],
    icon: 'fa-solid fa-circle-play',
    category: 'education',
    generationContext:
      'How to Build a $10K/Month Side Business in 2026 thumbnail. ULTRA BOLD text (150-200px, weight 900). Max 3-5 words visible. Complementary color scheme (yellow text on dark blue). Must include thick text stroke/shadow for readability at small sizes. Arrow or highlight element pointing to key text.',
    slides: [
      {
        title: 'How-To Thumbnail',
        layout: 'single-design',
        prompt:
          'Create a YouTube thumbnail for "How to Build a $10K/Month Side Business." Dark blue gradient background (#1E3A5F to #0D1B2A). Main text: "$10K/MO" in massive ultra-bold yellow (#FFD700) text taking up about 50% of the canvas, with heavy black text-shadow (4px offset) and white outer stroke (3px) for maximum readability at tiny sizes. Weight must be 900 / Black. Above it: "BUILD A" in white bold, smaller. Below it: "SIDE BUSINESS" in white bold. Add a large yellow arrow pointing to the "$10K" from the left side. Right 35% of the canvas: leave space for a face/person cutout (represented by a subtle placeholder circle). Add "2026" in a small red badge in the top-right corner. Small cash/money icon elements scattered. Design must be instantly readable at 168x94 pixel YouTube sidebar size.',
      },
    ],
  },

  {
    id: 'youtube-thumbnail-review',
    name: 'Review Thumbnail',
    nameJa: 'レビュー',
    descriptionJa: '製品レビュー動画用サムネイル。評価スコアとフック要素で興味を引くデザイン。',
    format: 'youtube-thumbnail',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['creative-voltage', 'neon-cyber', 'electric-studio'],
    slideCount: 1,
    tags: ['レビュー', 'サムネイル', 'iPhone', 'ガジェット', 'YouTube'],
    icon: 'fa-solid fa-star-half-stroke',
    category: 'creative',
    generationContext:
      'iPhone 17 Pro - HONEST Review thumbnail. Rating "9.2/10" prominently displayed. ULTRA BOLD text with heavy stroke effect. Red/white on dark background. Space for face/product on right 40%. "WORTH IT?" text as hook element. Must be readable at 168x94px.',
    slides: [
      {
        title: 'Review Thumbnail',
        layout: 'single-design',
        prompt:
          'Create a YouTube thumbnail for an iPhone 17 Pro review. Dark background (#0D1117) with subtle red gradient glow from center. Left 60% of canvas: "iPhone 17 Pro" in bold white text at the top area. Dominant element: "9.2" in massive ultra-bold red (#FF3B30) text with white stroke (3px) and heavy drop shadow, taking up significant vertical space. "/10" next to it in white, slightly smaller. Below the score: "HONEST REVIEW" in white uppercase bold text. "WORTH IT?" in yellow (#FFD700) bold text with a question mark, positioned as a hook element with a slight rotation (-3 degrees) for dynamic feel. Right 40%: reserved space for product/face (subtle phone silhouette placeholder and circle for face). Add a thin red accent bar across the top. Everything must have thick strokes/shadows for 168x94px readability.',
      },
    ],
  },

  {
    id: 'youtube-thumbnail-ranking',
    name: 'Ranking Thumbnail',
    nameJa: 'ランキング',
    descriptionJa: 'ランキング動画用サムネイル。ネオンサイバー風の演出でTOP 5を印象的に表現。',
    format: 'youtube-thumbnail',
    suggestedStylePreset: 'neon-cyber',
    alternativeStylePresets: ['creative-voltage', 'bold-signal', 'terminal-green'],
    slideCount: 1,
    tags: ['ランキング', 'サムネイル', 'プログラミング', 'テック', 'YouTube'],
    icon: 'fa-solid fa-ranking-star',
    category: 'creative',
    generationContext:
      'TOP 5 Programming Languages 2026 ranking thumbnail. Large "TOP 5" text with neon glow effect. Numbered list hint or podium visual. Cyber/tech aesthetic with bright gradients. Must pop in YouTube sidebar. ULTRA BOLD weight 900.',
    slides: [
      {
        title: 'Ranking Thumbnail',
        layout: 'single-design',
        prompt:
          'Create a YouTube thumbnail for "TOP 5 Programming Languages 2026." Black background (#0A0A0F) with a matrix-style or circuit-board subtle pattern overlay. Left 55%: "TOP" in bold white text with cyan (#00F0FF) neon glow effect at the top. "5" as a massive ultra-bold number taking up most of the vertical space, filled with a gradient from cyan (#00F0FF) to magenta (#FF00E5), with neon outer glow and heavy drop shadow. Weight 900/Black. Below: "PROGRAMMING" and "LANGUAGES" stacked in white bold text. Right 45%: Stacked numbered items suggesting the ranking - five horizontal bars decreasing in width from top to bottom, numbered 1-5, each with a different neon color (gold, silver, bronze for top 3, then cyan, green). "2026" in a glowing badge at the top-right. Add code-like decorative elements (curly braces, angle brackets) in subtle neon. Must be eye-catching at YouTube sidebar size.',
      },
    ],
  },

  {
    id: 'youtube-thumbnail-breaking-news',
    name: 'Breaking News Thumbnail',
    nameJa: 'ニュース速報',
    descriptionJa: 'ニュース速報風サムネイル。ドラマチックなライティングとアラートカラーで緊急感を演出。',
    format: 'youtube-thumbnail',
    suggestedStylePreset: 'creative-voltage',
    alternativeStylePresets: ['bold-signal', 'neon-cyber', 'electric-studio'],
    slideCount: 1,
    tags: ['ニュース速報', 'サムネイル', 'AI', 'テック', 'YouTube'],
    icon: 'fa-solid fa-bolt',
    category: 'creative',
    generationContext:
      'AI Just Changed EVERYTHING breaking news style thumbnail. "BREAKING" badge element. Dramatic lighting/gradient. Shocked/excited energy. Yellow/red alert colors. ULTRA BOLD 200px text. Minimal words, maximum impact.',
    slides: [
      {
        title: 'Breaking News Thumbnail',
        layout: 'single-design',
        prompt:
          'Create a YouTube thumbnail for "AI Just Changed EVERYTHING" breaking news style video. Dark background with dramatic radial gradient burst from center (dark to red/orange edges suggesting explosion/urgency). Top-left corner: "BREAKING" in a solid red (#DC2626) badge/banner with white bold text, styled like a news chyron with slight skew. Center dominant text: "AI CHANGED" in first line and "EVERYTHING" in second line, both in massive ultra-bold white text (200px+ equivalent) with heavy red outer stroke (4px) and black drop shadow (6px). Weight 900/Black. Add yellow (#FBBF24) lightning bolt or exclamation elements for urgency. Right side: space for shocked face placeholder (circle outline). Bottom: subtle red scanning/glitch line effect. Add a small "2026" year indicator. Everything must scream urgency and be instantly readable at 168x94px. Maximum 4-5 words on screen.',
      },
    ],
  },

  {
    id: 'youtube-thumbnail-vlog',
    name: 'Vlog Thumbnail',
    nameJa: 'Vlog',
    descriptionJa: 'Vlog動画用サムネイル。パステル調の暖かみあるデザインで親しみやすさを表現。',
    format: 'youtube-thumbnail',
    suggestedStylePreset: 'split-pastel',
    alternativeStylePresets: ['pastel-geometry', 'notebook-tabs', 'kyoto-classic'],
    slideCount: 1,
    tags: ['Vlog', 'サムネイル', '東京', '旅行', 'YouTube'],
    icon: 'fa-solid fa-video',
    category: 'personal',
    generationContext:
      'A Week in Tokyo vlog thumbnail. Warm, inviting aesthetic. Pastel color overlay. "TOKYO VLOG" in friendly bold font. Cherry blossom or torii gate visual elements. Approachable, lifestyle feel. Soft shadows, rounded elements.',
    slides: [
      {
        title: 'Vlog Thumbnail',
        layout: 'single-design',
        prompt:
          'Create a YouTube thumbnail for "A Week in Tokyo" vlog. Warm pastel pink (#FFF1F2) to peach (#FECDD3) gradient background with soft, dreamy feel. Main text: "TOKYO" in large bold friendly font (weight 700-800) in deep rose (#BE123C) with soft white shadow, positioned in the upper-left 60% of canvas. "VLOG" directly below in a rounded pill/badge shape with pink background. Add decorative Japanese-themed elements: small torii gate silhouette in coral, scattered cherry blossom petal shapes in light pink, a small rising sun motif. "A Week In" written in a casual handwritten-style script above "TOKYO". Right 40%: space for face/person placeholder (large circle with soft pink border). Bottom: small travel-related icons (camera, airplane, chopsticks) in a subtle row. Rounded corners on all elements. Soft drop shadows throughout. Approachable, warm, lifestyle aesthetic. Must be inviting at thumbnail size.',
      },
    ],
  },

  // ==========================================================================
  // X POST (1200x675) - 5 templates
  // ==========================================================================

  {
    id: 'x-post-data-stats',
    name: 'Data & Stats Post',
    nameJa: 'データ・統計ポスト',
    descriptionJa: '調査データや統計数値をインパクトのあるビジュアルで共有するXポスト。大きな数字と出典表記で信頼性を高めるインフォグラフィック風デザイン。',
    format: 'x-post',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['bold-signal', 'terminal-green'],
    slideCount: 1,
    tags: ['データ', '統計', 'インフォグラフィック', 'リサーチ', 'SNS', 'X'],
    icon: 'fa-solid fa-chart-bar',
    category: 'data',
    generationContext: 'Tech industry stat: "Remote workers are 23% more productive" — Stanford 2025 study. Clean data visualization with large stat number. Source attribution. Shareable infographic style.',
    slides: [
      {
        title: 'データ・統計ポスト',
        layout: 'single-design',
        prompt: 'Create a shareable X post image highlighting a tech industry statistic: "Remote workers are 23% more productive" from a Stanford 2025 study. Feature the stat number "23%" prominently at large scale (120px+). Include a minimal bar chart or visual comparison element. Add source attribution "Stanford Remote Work Study, 2025" at the bottom in smaller text. Clean data visualization style with strong visual hierarchy. Use sans-serif typography. Leave breathing room around the key number. Horizontal 1200x675 format.',
      },
    ],
  },

  {
    id: 'x-post-tips',
    name: 'Tips Card Post',
    nameJa: 'ティップスカード',
    descriptionJa: '実用的なヒントやショートカットを番号付きリストで紹介するXポスト。開発者向けのクリーンなコード風デザイン。',
    format: 'x-post',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['neon-cyber', 'terminal-green'],
    slideCount: 1,
    tags: ['ティップス', 'ショートカット', '開発者', 'プログラミング', 'SNS', 'X'],
    icon: 'fa-solid fa-lightbulb',
    category: 'education',
    generationContext: '"3 VS Code Shortcuts That Save 2 Hours/Day" tips card. Numbered tips: Ctrl+D multi-select, Ctrl+Shift+P command palette, Alt+Click multi-cursor. Clean developer-focused design. Code-style aesthetic.',
    slides: [
      {
        title: 'ティップスカード',
        layout: 'single-design',
        prompt: 'Design a developer tips card for X post: "3 VS Code Shortcuts That Save 2 Hours/Day". List three numbered tips with keyboard shortcut badges: 1) Ctrl+D for multi-select editing, 2) Ctrl+Shift+P for command palette mastery, 3) Alt+Click for multi-cursor power. Use monospace font for shortcuts. Code editor-inspired aesthetic with subtle syntax highlighting colors. Bold headline, clean numbered layout with icon accents for each tip. 1200x675 landscape format.',
      },
    ],
  },

  {
    id: 'x-post-quote',
    name: 'Quote Card Post',
    nameJa: '引用カード',
    descriptionJa: '名言や格言を美しいタイポグラフィで表現するXポスト。ダークボタニカルな背景で洗練された雰囲気を演出。',
    format: 'x-post',
    suggestedStylePreset: 'dark-botanical',
    alternativeStylePresets: ['kyoto-classic', 'vintage-editorial'],
    slideCount: 1,
    tags: ['名言', '引用', 'タイポグラフィ', 'SNS', 'X'],
    icon: 'fa-solid fa-quote-left',
    category: 'creative',
    generationContext: 'Quote card: "Design is not just what it looks like. Design is how it works." — Steve Jobs. Elegant serif typography on dark botanical background. Minimal, sophisticated.',
    slides: [
      {
        title: '引用カード',
        layout: 'single-design',
        prompt: 'Create an elegant quote card: "Design is not just what it looks like and feels like. Design is how it works." attributed to Steve Jobs. Use sophisticated serif typography for the quote, lighter weight for attribution. Dark moody background with subtle botanical leaf silhouettes. Large quotation marks as decorative elements. Minimal, refined composition with generous whitespace. 1200x675 landscape format.',
      },
    ],
  },

  {
    id: 'x-post-announcement',
    name: 'Announcement Post',
    nameJa: '告知ポスト',
    descriptionJa: 'プロダクトアップデートやリリースを力強く告知するXポスト。大胆なデザインでフィーチャーバッジを配置。',
    format: 'x-post',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['electric-studio', 'neon-cyber'],
    slideCount: 1,
    tags: ['告知', 'リリース', 'プロダクト', 'アップデート', 'SNS', 'X'],
    icon: 'fa-solid fa-bullhorn',
    category: 'marketing',
    generationContext: 'Product update announcement for fictional SaaS "CloudBase": "v3.0 is HERE" - Real-time collaboration, 5x faster queries, new dashboard. Bold impact design. Icon badges for features.',
    slides: [
      {
        title: '告知ポスト',
        layout: 'single-design',
        prompt: 'Design a bold product announcement X post for fictional SaaS "CloudBase": headline "v3.0 is HERE" in massive impact typography. Feature three key updates with icon badges: real-time collaboration (people icon), 5x faster queries (lightning icon), new dashboard (grid icon). High-energy, celebratory design with dynamic gradients. Include a subtle product logo placeholder at top. 1200x675 landscape format.',
      },
    ],
  },

  {
    id: 'x-post-infographic',
    name: 'Infographic Post',
    nameJa: 'インフォグラフィックポスト',
    descriptionJa: 'ビジネスデータをビジュアル階層で整理したインフォグラフィック風Xポスト。アイコンとジオメトリックなレイアウト。',
    format: 'x-post',
    suggestedStylePreset: 'pastel-geometry',
    alternativeStylePresets: ['swiss-modern', 'split-pastel'],
    slideCount: 1,
    tags: ['インフォグラフィック', 'HR', 'データ可視化', 'SNS', 'X'],
    icon: 'fa-solid fa-circle-info',
    category: 'data',
    generationContext: '"The Cost of a Bad Hire" infographic. Stats: Average cost $17,000, 30% of first-year earnings, 36% of companies report bad hires. Visual data hierarchy with icons. Clean geometric layout.',
    slides: [
      {
        title: 'インフォグラフィックポスト',
        layout: 'single-design',
        prompt: 'Create an infographic X post: "The Cost of a Bad Hire". Display three key statistics with visual hierarchy: average cost $17,000 (dollar icon), 30% of first-year earnings (percentage circle), 36% of companies report bad hires (people icon). Use geometric shapes to frame each stat block. Clean pastel color coding for each data point. Title at top in bold, stats arranged in a balanced three-section layout. 1200x675 landscape format.',
      },
    ],
  },

  // ==========================================================================
  // PINTEREST PIN (1000x1500) - 5 templates
  // ==========================================================================

  {
    id: 'pinterest-pin-recipe',
    name: 'Recipe Pin',
    nameJa: 'レシピピン',
    descriptionJa: '材料と手順をステップバイステップで紹介するレシピピン。ヴィンテージエディトリアル風の温かみあるデザイン。',
    format: 'pinterest-pin',
    suggestedStylePreset: 'vintage-editorial',
    alternativeStylePresets: ['kyoto-classic', 'notebook-tabs'],
    slideCount: 1,
    tags: ['レシピ', '料理', '抹茶ラテ', '手順', 'Pinterest'],
    icon: 'fa-solid fa-utensils',
    category: 'education',
    generationContext: '"Perfect Matcha Latte" recipe pin. Ingredients: matcha 2g, milk 200ml, honey. Steps: 1. Sift matcha 2. Whisk with 80C water 3. Steam milk 4. Pour & enjoy. Warm vintage food photography style.',
    slides: [
      {
        title: 'レシピピン',
        layout: 'single-design',
        prompt: 'Design a tall Pinterest recipe pin for "Perfect Matcha Latte". Top section: elegant title with matcha green accent color. Ingredients list: matcha powder 2g, milk 200ml, honey to taste. Four numbered steps: 1) Sift matcha into bowl, 2) Whisk with 80C water until frothy, 3) Steam milk separately, 4) Pour milk over matcha and enjoy. Warm vintage food photography aesthetic with serif headings, muted earth tones. Vertical 1000x1500 layout optimized for Pinterest saves.',
      },
    ],
  },

  {
    id: 'pinterest-pin-checklist',
    name: 'Checklist Pin',
    nameJa: 'チェックリストピン',
    descriptionJa: '朝のルーティンをチェックボックス形式で紹介するピン。ノートブック風のエディトリアルデザイン。',
    format: 'pinterest-pin',
    suggestedStylePreset: 'notebook-tabs',
    alternativeStylePresets: ['vintage-editorial', 'pastel-geometry'],
    slideCount: 1,
    tags: ['チェックリスト', 'ルーティン', '習慣', '生産性', 'Pinterest'],
    icon: 'fa-solid fa-list-check',
    category: 'personal',
    generationContext: '"Morning Routine Checklist" for productivity. 8 items: Wake 6AM, Hydrate, 10min meditation, Journal, Exercise 30min, Cold shower, Healthy breakfast, Review goals. Notebook/editorial aesthetic with checkbox graphics.',
    slides: [
      {
        title: 'チェックリストピン',
        layout: 'single-design',
        prompt: 'Design a Pinterest checklist pin: "Morning Routine Checklist" for productivity. Eight items with decorative checkbox graphics: Wake at 6AM, Hydrate, 10-minute meditation, Journal, Exercise 30 minutes, Cold shower, Healthy breakfast, Review daily goals. Notebook/editorial aesthetic with ruled lines and tab dividers. Warm paper background. Each item on its own line with generous spacing. Vertical 1000x1500 format.',
      },
    ],
  },

  {
    id: 'pinterest-pin-fashion',
    name: 'Fashion Trend Pin',
    nameJa: 'ファッショントレンドピン',
    descriptionJa: 'シーズンのカラートレンドをムードボード風に紹介するファッションピン。パステルカラーのスウォッチと遊び心あるタイポグラフィ。',
    format: 'pinterest-pin',
    suggestedStylePreset: 'split-pastel',
    alternativeStylePresets: ['pastel-geometry', 'creative-voltage'],
    slideCount: 1,
    tags: ['ファッション', 'カラートレンド', 'パステル', 'ムードボード', 'Pinterest'],
    icon: 'fa-solid fa-palette',
    category: 'creative',
    generationContext: '"Spring 2026 Color Trends" fashion mood board. Colors: Lavender Haze, Sage Green, Butter Yellow, Sunset Coral. Swatch blocks with color names. Playful pastel aesthetic.',
    slides: [
      {
        title: 'ファッショントレンドピン',
        layout: 'single-design',
        prompt: 'Design a fashion mood board Pinterest pin: "Spring 2026 Color Trends". Feature four color swatches as large horizontal bands: Lavender Haze (#B8A9C9), Sage Green (#9CAF88), Butter Yellow (#F5E6A3), Sunset Coral (#F4845F). Each swatch takes a horizontal band with the color name in elegant typography. Playful pastel aesthetic with fashion-forward sans-serif type. Title at top in stylish lettering. Vertical 1000x1500 format.',
      },
    ],
  },

  {
    id: 'pinterest-pin-diy',
    name: 'DIY Guide Pin',
    nameJa: 'DIYガイドピン',
    descriptionJa: '簡単なDIYチュートリアルをステップ付きで紹介するピン。パステルジオメトリーのクラフト風デザイン。',
    format: 'pinterest-pin',
    suggestedStylePreset: 'pastel-geometry',
    alternativeStylePresets: ['notebook-tabs', 'split-pastel'],
    slideCount: 1,
    tags: ['DIY', 'ハンドメイド', 'クラフト', 'チュートリアル', 'Pinterest'],
    icon: 'fa-solid fa-scissors',
    category: 'education',
    generationContext: '"5-Minute Desk Organizer" DIY tutorial. Materials: cardboard, washi tape, glue. 4 steps. Craft/maker aesthetic. Friendly numbered instructions.',
    slides: [
      {
        title: 'DIYガイドピン',
        layout: 'single-design',
        prompt: 'Design a DIY tutorial Pinterest pin: "5-Minute Desk Organizer". Materials section at top: cardboard box, washi tape, craft glue. Four numbered step panels: 1) Cut cardboard to size, 2) Wrap with washi tape, 3) Create divider sections, 4) Assemble and decorate. Friendly craft/maker aesthetic with pastel geometric background shapes. Time badge "Only 5 min!" in a circle. Vertical 1000x1500 format.',
      },
    ],
  },

  {
    id: 'pinterest-pin-inspiration',
    name: 'Inspiration Pin',
    nameJa: 'インスピレーションピン',
    descriptionJa: '侘び寂びの美学をモダンインテリアに応用したインスピレーションピン。静謐な禅のデザインと伝統的な日本の色彩。',
    format: 'pinterest-pin',
    suggestedStylePreset: 'kyoto-classic',
    alternativeStylePresets: ['dark-botanical', 'vintage-editorial'],
    slideCount: 1,
    tags: ['侘び寂び', 'インテリア', '和風', 'ミニマリスト', 'Pinterest'],
    icon: 'fa-solid fa-spa',
    category: 'personal',
    generationContext: '"Wabi-Sabi Living" inspiration pin. Japanese aesthetic philosophy applied to modern interior design. Key principles: imperfection, simplicity, nature. Serene, zen-like design.',
    slides: [
      {
        title: 'インスピレーションピン',
        layout: 'single-design',
        prompt: 'Create a serene inspiration Pinterest pin: "Wabi-Sabi Living". Japanese aesthetic philosophy applied to modern interior. Three key principles as elegant text blocks: Embrace Imperfection, Find Beauty in Simplicity, Connect with Nature. Zen-like design with traditional Japanese color palette — warm grays, indigo, matcha green, cream. Include subtle enso circle element. Peaceful atmosphere with generous negative space. Vertical 1000x1500 format.',
      },
    ],
  },

  // ==========================================================================
  // LINKEDIN POST (1080x1080) - 5 templates
  // ==========================================================================

  {
    id: 'linkedin-post-industry-data',
    name: 'Industry Data Post',
    nameJa: '業界データカード',
    descriptionJa: '業界の統計データやトレンドをプロフェッショナルに可視化するLinkedInポスト。信頼性の高いデータソース付き。',
    format: 'linkedin-post',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['bold-signal', 'terminal-green'],
    slideCount: 1,
    tags: ['AI', '業界データ', 'エンタープライズ', '統計', 'LinkedIn'],
    icon: 'fa-solid fa-chart-pie',
    category: 'data',
    generationContext: '"AI Adoption in Enterprise 2025" data card. Stats: 78% of Fortune 500 use AI, $184B market size, 3.4x ROI average, Top sectors: Finance 89%, Healthcare 72%, Retail 65%. Source: McKinsey Digital 2025.',
    slides: [
      {
        title: '業界データカード',
        layout: 'single-design',
        prompt: 'Design a professional LinkedIn data card: "AI Adoption in Enterprise 2025". Key statistics in a clean grid layout: 78% of Fortune 500 use AI (large percentage), $184B market size (dollar figure with growth arrow), 3.4x average ROI. Sector breakdown: Finance 89%, Healthcare 72%, Retail 65% as horizontal progress bars. Source "McKinsey Digital 2025" at bottom. Swiss typographic style with strict grid alignment. Square 1080x1080 format.',
      },
    ],
  },

  {
    id: 'linkedin-post-hiring',
    name: 'Hiring Post',
    nameJa: '採用ポスト',
    descriptionJa: 'テック企業の採用告知とカルチャー紹介を兼ねたLinkedInポスト。モダンなリクルートメントビジュアル。',
    format: 'linkedin-post',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['bold-signal', 'creative-voltage'],
    slideCount: 1,
    tags: ['採用', 'リクルート', 'スタートアップ', '求人', 'LinkedIn'],
    icon: 'fa-solid fa-user-plus',
    category: 'business',
    generationContext: '"We\'re Hiring!" for fictional startup "DataPulse". Roles: Senior ML Engineer, Product Designer, DevOps Lead. Culture: Remote-first, 4-day week, unlimited learning budget.',
    slides: [
      {
        title: '採用ポスト',
        layout: 'single-design',
        prompt: 'Design a modern hiring post for LinkedIn: "We\'re Hiring!" for fictional startup "DataPulse". Three open roles with icon badges: Senior ML Engineer (brain icon), Product Designer (pen-tool icon), DevOps Lead (cloud icon). Culture highlights: Remote-first, 4-day work week, Unlimited learning budget. Modern tech company feel. Square 1080x1080 format.',
      },
    ],
  },

  {
    id: 'linkedin-post-case-study',
    name: 'Case Study Post',
    nameJa: '成功事例カード',
    descriptionJa: 'ビフォー/アフターの数値改善を強調するケーススタディLinkedInポスト。インパクトのある大きな数字で成果をアピール。',
    format: 'linkedin-post',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['swiss-modern', 'electric-studio'],
    slideCount: 1,
    tags: ['ケーススタディ', '成功事例', 'SaaS', '改善', 'LinkedIn'],
    icon: 'fa-solid fa-arrow-trend-up',
    category: 'business',
    generationContext: '"How Company X Reduced Churn by 47%". Client: "StreamFlow". Before: 8.2% monthly churn. After: 4.3%. Method: AI-powered customer health scoring. Timeline: 6 months.',
    slides: [
      {
        title: '成功事例カード',
        layout: 'single-design',
        prompt: 'Design a case study result card for LinkedIn: "How Company X Reduced Churn by 47%". Client: "StreamFlow". Before/after comparison: Before 8.2% (red tone) vs After 4.3% (green tone) with large downward arrow. Method: "AI-powered customer health scoring". Timeline badge: "6 months". Bold impact numbers. Square 1080x1080 format.',
      },
    ],
  },

  {
    id: 'linkedin-post-event',
    name: 'Event Announcement Post',
    nameJa: 'イベント告知ポスト',
    descriptionJa: 'カンファレンスやサミットの告知用LinkedInポスト。日時・場所・トピックを整理したプロフェッショナルなデザイン。',
    format: 'linkedin-post',
    suggestedStylePreset: 'pastel-geometry',
    alternativeStylePresets: ['electric-studio', 'swiss-modern'],
    slideCount: 1,
    tags: ['イベント', 'カンファレンス', 'サミット', '東京', 'LinkedIn'],
    icon: 'fa-solid fa-calendar-days',
    category: 'marketing',
    generationContext: '"Product Management Summit 2026". Date: Oct 20-21. Location: Tokyo Midtown. Topics: AI product strategy, growth frameworks, user research. Early bird tickets available.',
    slides: [
      {
        title: 'イベント告知ポスト',
        layout: 'single-design',
        prompt: 'Design a LinkedIn event announcement: "Product Management Summit 2026". Date Oct 20-21 in a calendar badge, Location Tokyo Midtown with pin icon. Three topic pills: AI Product Strategy, Growth Frameworks, User Research. "Early Bird Tickets Available" CTA at bottom. Geometric background shapes in soft pastel tones. Square 1080x1080 format.',
      },
    ],
  },

  {
    id: 'linkedin-post-pro-tips',
    name: 'Pro Tips Post',
    nameJa: 'プロのコツカード',
    descriptionJa: '専門知識を5つのポイントで紹介するLinkedInポスト。エディトリアルなノートブック風デザイン。',
    format: 'linkedin-post',
    suggestedStylePreset: 'notebook-tabs',
    alternativeStylePresets: ['vintage-editorial', 'swiss-modern'],
    slideCount: 1,
    tags: ['PMF', 'プロダクト', 'スタートアップ', 'ヒント', 'LinkedIn'],
    icon: 'fa-solid fa-star',
    category: 'education',
    generationContext: '"5 Signs Your Product Has Product-Market Fit". Signs: 1) Users return without prompting 2) NPS > 50 3) Organic growth > 40% 4) Users very disappointed without it 5) Word-of-mouth referrals.',
    slides: [
      {
        title: 'プロのコツカード',
        layout: 'single-design',
        prompt: 'Design a LinkedIn tips card: "5 Signs Your Product Has Product-Market Fit". Numbered list with editorial styling: 1) Users come back without prompting, 2) NPS above 50, 3) Organic growth exceeds 40%, 4) Users would be very disappointed without it, 5) Word-of-mouth referrals increasing. Notebook/editorial aesthetic with ruled lines and tab markers. Warm paper-like background. Square 1080x1080 format.',
      },
    ],
  },

  // ==========================================================================
  // A4 PRINT (2480x3508) - 5 templates
  // ==========================================================================

  {
    id: 'a4-corporate-brochure',
    name: 'Corporate Brochure',
    nameJa: '企業パンフレット',
    descriptionJa: 'コンサルティング企業の会社案内。サービス概要・実績・連絡先をセクション分けしたプロフェッショナルな印刷用レイアウト。',
    format: 'a4',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['swiss-modern', 'bold-signal'],
    slideCount: 1,
    tags: ['企業', 'パンフレット', '会社案内', '印刷', 'A4'],
    icon: 'fa-solid fa-building',
    category: 'business',
    generationContext: 'Corporate brochure for "Vertex Partners". Services: Strategy, Digital Transformation, M&A Advisory. Founded 2015, 200+ consultants, offices in Tokyo/Singapore/London. 500+ projects, 98% client satisfaction, $2.1B in client value created.',
    slides: [
      {
        title: '企業パンフレット',
        layout: 'single-design',
        prompt: 'Design a corporate brochure for "Vertex Partners" in A4 portrait. Header with company name and tagline "Strategy. Transformation. Growth." About section: Founded 2015, 200+ consultants, Tokyo/Singapore/London. Services in three columns: Strategy Consulting, Digital Transformation, M&A Advisory with icons. Stats bar: 500+ projects, 98% satisfaction, $2.1B client value. Contact section at bottom. CMYK-safe colors, proper margins for 3mm bleed. 2480x3508 print layout.',
      },
    ],
  },

  {
    id: 'a4-event-flyer',
    name: 'Event Flyer',
    nameJa: 'イベントフライヤー',
    descriptionJa: '音楽フェスティバルのフライヤー。ヘッドライナー・日程・会場情報をエネルギッシュなデザインで表現する印刷用A4。',
    format: 'a4',
    suggestedStylePreset: 'creative-voltage',
    alternativeStylePresets: ['neon-cyber', 'electric-studio'],
    slideCount: 1,
    tags: ['フライヤー', '音楽フェス', 'イベント', '印刷', 'A4'],
    icon: 'fa-solid fa-music',
    category: 'marketing',
    generationContext: 'Music festival flyer "SONIC WAVE 2026". Date: Aug 8-10. Venue: Odaiba Seaside Park. Headliners: NEON DRIFT, Glass Meridian, Pulse Theory. Tickets from 8,000 yen.',
    slides: [
      {
        title: 'イベントフライヤー',
        layout: 'single-design',
        prompt: 'Design an A4 music festival flyer: "SONIC WAVE 2026". Massive headline with electric feel. Date: August 8-10, 2026. Venue: Odaiba Seaside Park, Tokyo. Lineup: "NEON DRIFT" (largest), "Glass Meridian", "Pulse Theory" plus "and 20+ more". Tickets from 8,000 yen, Early Bird available. High-energy design with vibrant gradients. QR code placeholder. Print-ready with bleed margins. 2480x3508 format.',
      },
    ],
  },

  {
    id: 'a4-menu',
    name: 'Restaurant Menu',
    nameJa: 'レストランメニュー',
    descriptionJa: '和食割烹店のメニュー。季節の料理を伝統的な和のタイポグラフィと上品なレイアウトで表現する印刷用A4。',
    format: 'a4',
    suggestedStylePreset: 'kyoto-classic',
    alternativeStylePresets: ['vintage-editorial', 'dark-botanical'],
    slideCount: 1,
    tags: ['メニュー', 'レストラン', '和食', '割烹', '印刷', 'A4'],
    icon: 'fa-solid fa-bowl-food',
    category: 'creative',
    generationContext: 'Japanese restaurant menu for "Kappo Tsukishiro". Courses: Seasonal Appetizer 1,800 yen, Sashimi 2,400 yen, Wagyu 4,200 yen, Tempura 2,000 yen, Rice 800 yen, Dessert 1,200 yen. Traditional Japanese aesthetic.',
    slides: [
      {
        title: 'レストランメニュー',
        layout: 'single-design',
        prompt: 'Design a Japanese restaurant menu in A4 portrait for "Kappo Tsukishiro" (割烹 月白). Menu items: Seasonal Appetizer (季節の前菜) 1,800 yen, Assorted Sashimi (刺身盛り合わせ) 2,400 yen, Charcoal-Grilled Wagyu (黒毛和牛炭火焼) 4,200 yen, Tempura Platter (天ぷら盛り合わせ) 2,000 yen, Clay Pot Rice (釜炊きご飯) 800 yen, Seasonal Dessert (季節のデザート) 1,200 yen. Elegant Japanese typography with vertical text elements. Traditional indigo and cream palette. Washi paper texture feel. 2480x3508 print layout.',
      },
    ],
  },

  {
    id: 'a4-resume',
    name: 'Modern Resume',
    nameJa: '履歴書・職務経歴書',
    descriptionJa: 'モダンな2カラムレイアウトの履歴書。スキル・経歴・学歴を見やすく整理したスイスタイポグラフィ風の印刷用A4。',
    format: 'a4',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['notebook-tabs', 'vintage-editorial'],
    slideCount: 1,
    tags: ['履歴書', '職務経歴書', 'CV', 'レジュメ', '印刷', 'A4'],
    icon: 'fa-solid fa-file-lines',
    category: 'personal',
    generationContext: 'Resume for "Akira Yamamoto", Senior Product Manager. 8 years at Google, Amazon, startup. Skills: Product Strategy, Data Analysis, Agile, SQL, Figma. Keio University MBA. Two-column layout.',
    slides: [
      {
        title: '履歴書・職務経歴書',
        layout: 'single-design',
        prompt: 'Design a modern resume in A4 portrait for "Akira Yamamoto", Senior Product Manager. Two-column: Left sidebar (~35%) with contact info, Skills (Product Strategy, Data Analysis, Agile, SQL, Figma), Languages (Japanese native, English fluent). Right main (~65%): Summary, Experience (Lead PM Google 2022-present, Senior PM Amazon 2019-2022, PM TechNova 2017-2019), Education (Keio University MBA 2017). Swiss typography with clean sans-serif, minimal accent color. 2480x3508 print layout.',
      },
    ],
  },

  {
    id: 'a4-newsletter',
    name: 'Newsletter',
    nameJa: 'ニュースレター',
    descriptionJa: 'スタートアップ業界の月刊ニュースレター。エディターズノート・トップ記事・速報をマルチカラムで紙面風に構成。',
    format: 'a4',
    suggestedStylePreset: 'notebook-tabs',
    alternativeStylePresets: ['vintage-editorial', 'swiss-modern'],
    slideCount: 1,
    tags: ['ニュースレター', 'スタートアップ', '業界ニュース', '印刷', 'A4'],
    icon: 'fa-solid fa-newspaper',
    category: 'business',
    generationContext: '"The Startup Digest - January 2026". Sections: Editor\'s Note, Top Story (AI startup raises $100M), Quick Reads, Event Calendar, Quote of the Month. Editorial newspaper-style layout.',
    slides: [
      {
        title: 'ニュースレター',
        layout: 'single-design',
        prompt: 'Design a monthly newsletter in A4 portrait: "The Startup Digest — January 2026". Masthead with newsletter title in bold editorial serif, issue date. Sections: Editor\'s Note (brief intro), Top Story "AI Startup NeuralPath Raises $100M Series C", Quick Reads sidebar (funding roundup, product launches, trends), Event Calendar with 3 events, Quote of the Month in pullquote block. Multi-column editorial layout with clear section dividers. 2480x3508 print format.',
      },
    ],
  },

  // ==========================================================================
  // INDUSTRY-SPECIFIC TEMPLATES (60 templates across 11 industries)
  // ==========================================================================
  ...FB_TEMPLATES,
  ...BEAUTY_TEMPLATES,
  ...REALESTATE_TEMPLATES,
  ...MEDICAL_TEMPLATES,
  ...EDUCATION_TEMPLATES,
  ...FITNESS_TEMPLATES,
  ...EC_TEMPLATES,
  ...IT_TEMPLATES,
  ...EVENT_TEMPLATES,
  ...FREELANCE_TEMPLATES,
  ...PET_TEMPLATES,
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Find a template by its unique ID.
 */
export function getTemplateById(id: string): BuiltInTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

/**
 * Filter templates by canvas format (e.g. "16:9", "instagram-post").
 */
export function getTemplatesByFormat(format: string): BuiltInTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.format === format);
}

/**
 * Filter templates by category (e.g. "business", "marketing").
 */
export function getTemplatesByCategory(
  category: BuiltInTemplate['category'],
): BuiltInTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Search templates by keyword (matches against id, name, nameJa, descriptionJa, tags).
 */
export function searchTemplates(query: string): BuiltInTemplate[] {
  const q = query.toLowerCase();
  return BUILT_IN_TEMPLATES.filter(
    (t) =>
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.nameJa.includes(q) ||
      t.descriptionJa.includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
}
