import { config } from "dotenv";
config({ override: true });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COLLECTIONS = [
  { name: "Advisors", slug: "advisors" },
  { name: "Structures", slug: "structures" },
  { name: "Companies", slug: "companies" },
  { name: "Tasks", slug: "tasks" },
  { name: "Tools & Pages", slug: "tools-pages" },
  { name: "System Prompts", slug: "system-prompts" },
] as const;

async function ensureCollections() {
  for (const c of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug },
    });
  }
}

async function seedAdvisorFields() {
  const advisors = await prisma.collection.findUnique({ where: { slug: "advisors" } });
  if (!advisors) return;

  const fields = [
    { label: "Name", key: "name", type: "text", required: true, order: 1 },
    { label: "Role", key: "role", type: "text", required: false, order: 2 },
    { label: "One-Liner", key: "oneliner", type: "text", required: false, order: 3 },
    // New canonical oneLiner key while preserving legacy "oneliner"
    { label: "One-Liner", key: "oneLiner", type: "text", required: false, order: 4 },
    { label: "Prompt", key: "prompt", type: "text", required: false, order: 5 },
    { label: "Style", key: "style", type: "text", required: false, order: 6 },
    { label: "Image", key: "image", type: "image", required: false, order: 50 },
    { label: "Knowledge Feed", key: "knowledgeFeed", type: "text", required: false, order: 51 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: advisors.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: advisors.id },
    });
  }
}

async function seedAdvisorRecords() {
  const advisors = await prisma.collection.findUnique({ where: { slug: "advisors" } });
  if (!advisors) return;

  const desired = [
    {
      name: "Rupert",
      role: "Strategy Master",
      oneLiner: "He’s like the lovechild of McKinsey and Sun Tzu — only faster, cheaper, and with a British accent.",
      prompt: "You are Rupert, the Strategy Master — the orchestrator who defines plans, assigns advisors, and integrates everything into a clear strategic vision.",
      style: "Visionary, confident, composed, always sees the full board before moving a piece.",
    },
    {
      name: "Gideon",
      role: "Data Strategist",
      oneLiner: "He’s like Sherlock Holmes for company data — sees patterns in your chaos and files them alphabetically.",
      prompt: "You are Gideon, the Data Strategist — analytical, structured, methodical. You turn scattered data into clarity and manage all company KPIs.",
      style: "Calculated, analytical, quietly brilliant, thrives on order and precision.",
    },
    {
      name: "Jade",
      role: "Modeling Ninja",
      oneLiner: "She’s like Gandalf, only in Excel and with an Asian-fintech edge — no magic, just immaculate formulas.",
      prompt: "You are Jade, the Modeling Ninja — a master of numbers and structure, who builds models, runs FP&A analyses, and makes the complex elegant.",
      style: "Sharp, disciplined, slightly perfectionist, speaks fluent spreadsheet.",
    },
    {
      name: "Dante",
      role: "Wall Street Insider",
      oneLiner: "He’s your inside man from Wall Street — part deal-maker, part assassin, always wearing cufflinks.",
      prompt: "You are Dante, the Wall Street Insider — capital markets pro who crafts valuations, comps, investor materials, and firm credentials.",
      style: "Charismatic, confident, aggressive when needed, always deal-ready.",
    },
    {
      name: "Aria",
      role: "Product Mentor",
      oneLiner: "She’s like if Steve Jobs went to therapy — all the vision, none of the yelling.",
      prompt: "You are Aria, the Product Mentor — strategic and creative; you turn vision into product roadmaps and stories that resonate.",
      style: "Visionary, empathetic, design-minded, and persuasive.",
    },
    {
      name: "Piotr",
      role: "Project Maestro",
      oneLiner: "He’s a Polish conductor for chaos — turns messy plans into crisp symphonies of deadlines.",
      prompt: "You are Piotr, the Project Maestro — pragmatic, structured, and relentless about execution and delivery.",
      style: "Disciplined, straightforward, highly reliable, time-driven.",
    },
    {
      name: "Salomon",
      role: "Industry Sage",
      oneLiner: "He’s the Yoda of markets — ancient wisdom, zero small talk.",
      prompt: "You are Salomon, the Industry Sage — analytical and experienced, offering context, benchmarks, and insight from the field.",
      style: "Wise, calm, data-driven, speaks rarely but precisely.",
    },
    {
      name: "Lyra",
      role: "Growth Alchemist",
      oneLiner: "She’s like Mad Men meets AI — growth strategies that actually convert, no whiskey required.",
      prompt: "You are Lyra, the Growth Alchemist — dynamic, creative, and results-oriented; you design GTM and growth strategies that drive adoption.",
      style: "Energetic, persuasive, marketing-savvy, thrives on momentum.",
    },
    {
      name: "Vera",
      role: "Legal Navigator",
      oneLiner: "She’s the Olivia Pope of contracts — cleans up messes before they make headlines.",
      prompt: "You are Vera, the Legal Navigator — sharp, precise, and protective; you manage contracts, term sheets, compliance, and RIF analyses.",
      style: "Cautious, detail-oriented, firm but fair.",
    },
    {
      name: "Noa",
      role: "People Architect",
      oneLiner: "She’s your culture whisperer — part Brené Brown, part HR ninja, all heart with a spreadsheet.",
      prompt: "You are Noa, the People Architect — empathetic and strategic; you build orgs, define hiring, and shape company culture.",
      style: "Warm, intuitive, people-first, balances empathy with structure.",
    },
  ];

  // Build a map of existing records by normalized name for idempotent updates
  const existing = await prisma.record.findMany({ where: { collectionId: advisors.id } });
  const norm = (s: unknown) => (typeof s === "string" ? s.trim().toLowerCase() : "");
  const nameToRecord: Record<string, { id: string; data: any }> = {};
  for (const r of existing) {
    const n = norm((r as any).data?.name);
    if (n) nameToRecord[n] = { id: r.id, data: (r as any).data };
  }

  let created = 0;
  let updated = 0;

  for (const a of desired) {
    const key = norm(a.name);
    const existingRec = nameToRecord[key];

    // Write both oneLiner (new) and legacy oneliner for back-compat
    const payload = {
      name: a.name,
      role: a.role,
      oneLiner: a.oneLiner,
      oneliner: a.oneLiner,
      prompt: a.prompt,
      style: a.style,
    };

    if (existingRec) {
      await prisma.record.update({
        where: { id: existingRec.id },
        data: { data: { ...(existingRec.data ?? {}), ...payload } },
      });
      updated++;
    } else {
      await prisma.record.create({
        data: { collectionId: advisors.id, data: payload },
      });
      created++;
    }
  }

  console.log(`Advisors: created ${created}, updated ${updated}`);
}

async function seedStructuresCollection() {
  const structures = await prisma.collection.findUnique({ where: { slug: "structures" } });
  if (!structures) return;

  const fields = [
    { label: "Title", key: "title", type: "text", required: true, order: 1 },
    { label: "Description", key: "description", type: "richtext", required: false, order: 2 },
    { label: "Tree", key: "tree", type: "json", required: false, order: 3 },
    { label: "Compiled", key: "compiled", type: "json", required: false, order: 4 },
    { label: "Live Preview", key: "livePreview", type: "boolean", required: false, order: 5 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: structures.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: structures.id },
    });
  }
}

async function seedStructureTemplates() {
  const structures = await prisma.collection.findUnique({ where: { slug: "structures" } });
  if (!structures) return;

  const templates = [
    {
      title: "Template — Business Plan (Short)",
      description: "A concise business plan template covering essential elements",
      tree: {
        children: [
          {
            id: "exec-summary",
            title: "Executive Summary",
            children: [
              {
                id: "vision-mission",
                title: "Vision & Mission",
                children: [
                  { id: "q1", title: "What is your company's vision statement?" },
                  { id: "q2", title: "What is your core mission?" }
                ]
              },
              {
                id: "value-prop",
                title: "Value Proposition",
                children: [
                  { id: "q3", title: "What unique value do you provide?" },
                  { id: "q4", title: "Who is your target customer?" }
                ]
              }
            ]
          },
          {
            id: "market-analysis",
            title: "Market Analysis",
            children: [
              {
                id: "market-size",
                title: "Market Size & Opportunity",
                children: [
                  { id: "q5", title: "What is your total addressable market?" },
                  { id: "q6", title: "What is your serviceable addressable market?" }
                ]
              },
              {
                id: "competition",
                title: "Competitive Landscape",
                children: [
                  { id: "q7", title: "Who are your main competitors?" },
                  { id: "q8", title: "What is your competitive advantage?" }
                ]
              }
            ]
          }
        ]
      },
      livePreview: false
    },
    {
      title: "Template — Financial Model (Lite)",
      description: "A lightweight financial modeling framework",
      tree: {
        children: [
          {
            id: "revenue-model",
            title: "Revenue Model",
            children: [
              {
                id: "revenue-streams",
                title: "Revenue Streams",
                children: [
                  { id: "q9", title: "What are your primary revenue streams?" },
                  { id: "q10", title: "What is your pricing strategy?" }
                ]
              },
              {
                id: "growth-projections",
                title: "Growth Projections",
                children: [
                  { id: "q11", title: "What is your projected growth rate?" },
                  { id: "q12", title: "What are your key growth drivers?" }
                ]
              }
            ]
          },
          {
            id: "cost-structure",
            title: "Cost Structure",
            children: [
              {
                id: "fixed-costs",
                title: "Fixed Costs",
                children: [
                  { id: "q13", title: "What are your main fixed expenses?" },
                  { id: "q14", title: "What is your monthly burn rate?" }
                ]
              },
              {
                id: "variable-costs",
                title: "Variable Costs",
                children: [
                  { id: "q15", title: "What are your variable cost drivers?" },
                  { id: "q16", title: "What is your gross margin target?" }
                ]
              }
            ]
          }
        ]
      },
      livePreview: false
    }
  ];

  let created = 0;
  let updated = 0;

  for (const template of templates) {
    const existing = await prisma.record.findFirst({
      where: {
        collectionId: structures.id,
        data: {
          path: ["title"],
          equals: template.title
        }
      }
    });

    if (existing) {
      await prisma.record.update({
        where: { id: existing.id },
        data: { data: template }
      });
      updated++;
    } else {
      await prisma.record.create({
        data: {
          collectionId: structures.id,
          data: template
        }
      });
      created++;
    }
  }

  console.log(`Structure templates: created ${created}, updated ${updated}`);
}

async function seedToolsPagesCollection() {
  const tools = await prisma.collection.findUnique({ where: { slug: "tools-pages" } });
  if (!tools) return;

  const fields = [
    { label: "Name", key: "name", type: "text", required: true, order: 1 },
    { label: "Main Advisor", key: "mainAdvisorId", type: "text", required: false, order: 2 },
    { label: "How it works 1", key: "howItWorks1", type: "text", required: false, order: 3 },
    { label: "How it works 2", key: "howItWorks2", type: "text", required: false, order: 4 },
    { label: "How it works 3", key: "howItWorks3", type: "text", required: false, order: 5 },
    { label: "How it works 4", key: "howItWorks4", type: "text", required: false, order: 6 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: tools.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: tools.id },
    });
  }

  // Seed one record per page (names only)
  const pages = [
    { name: "Home" },
    { name: "Login" },
    { name: "Admin" },
    { name: "Design Master" },
    { name: "Data Mapper" },
  ];
  const existing = await prisma.record.findFirst({ where: { collectionId: tools.id } });
  if (!existing) {
    await prisma.record.createMany({
      data: pages.map(p => ({ collectionId: tools.id, data: p })),
    });
  }
}

async function seedToolsPagesRecords() {
  const tools = await prisma.collection.findUnique({ where: { slug: "tools-pages" } });
  const advisors = await prisma.collection.findUnique({ where: { slug: "advisors" } });
  if (!tools) return;

  // Build advisor name -> id map (case-insensitive)
  const advisorIdByName: Record<string, string> = {};
  if (advisors) {
    const advisorRecs = await prisma.record.findMany({ where: { collectionId: advisors.id } });
    for (const r of advisorRecs) {
      const name = (r as any).data?.name;
      if (typeof name === "string" && name.trim()) {
        advisorIdByName[name.trim().toLowerCase()] = r.id;
      }
    }
  }

  const desired = [
    {
      name: "Data Mapper",
      mainAdvisorName: "Gideon",
      howItWorks1:
        "The Data Mapper helps you organize your company’s data, notes, and materials into structured, professional sections. It’s perfect for founders and executives who need clarity and consistency across decks, plans, or investor summaries.",
      howItWorks2:
        "In the **inputs panel**, upload your data, paste company notes, or chat with Gideon to clarify and fill in gaps. He’ll guide you toward a clean, logical layout.",
      howItWorks3:
        "The **outputs panel** displays your mapped data — organized into sections like Vision, Market, Product, and KPIs. Expand to full screen for detailed review and editing.",
      howItWorks4:
        "Finalize, polish, and export your structured company narrative to use in future documents or presentations.",
    },
    {
      name: "Model Builder",
      mainAdvisorName: "Jade",
      howItWorks1:
        "The Model Builder is your complete financial modeling engine. It helps you create dynamic, professional-grade models for planning, forecasting, and fundraising — no spreadsheets required.",
      howItWorks2:
        "In the **inputs panel**, add your assumptions: revenues, costs, hiring plans, and growth metrics. Jade will prompt you to refine or complete missing data.",
      howItWorks3:
        "The **outputs panel** will show your financial model summary — KPIs, metrics, and charts you can expand for detailed views.",
      howItWorks4:
        "Review assumptions, validate results, and export your model to Excel, PDF, or dashboard formats.",
    },
    {
      name: "Business Taxonomy",
      mainAdvisorName: "Gideon",
      howItWorks1:
        "The Business Taxonomy tool structures how your company is defined — across products, departments, and data categories. It’s the backbone of your reporting and analysis.",
      howItWorks2:
        "In the **inputs panel**, describe your company’s business lines, operations, and team structure. Gideon will guide you to create an accurate taxonomy.",
      howItWorks3:
        "The **outputs panel** presents your taxonomy visually or in list form. Expand to full screen to review category relationships and dependencies.",
      howItWorks4:
        "Approve the taxonomy and export it for use in business plans, dashboards, and models.",
    },
    {
      name: "Design Master",
      mainAdvisorName: "Rupert",
      howItWorks1:
        "The Design Master helps you create structured, persuasive presentations — investor decks, board updates, or strategic narratives. It defines your flow before you ever build slides.",
      howItWorks2:
        "In the **inputs panel**, choose your presentation type (e.g., investor update, board deck, company intro) and share key context. Rupert may pull in other advisors for content.",
      howItWorks3:
        "The **outputs panel** reveals your proposed deck structure — slide sequence, purpose, and notes. Expand to full screen for editing and review.",
      howItWorks4:
        "Confirm or adjust the outline, then export the structure as your ready-to-build deck blueprint.",
    },
    // Rupert – Strategy Master
    {
      name: "Strategy Planner",
      mainAdvisorName: "Rupert",
      howItWorks1:
        "The Strategy Planner helps you define company objectives, key initiatives, and success metrics — turning broad vision into actionable direction.",
      howItWorks2:
        "In the **inputs panel**, describe your company’s goals or current challenges. Rupert will guide you to articulate them clearly and prioritize actions.",
      howItWorks3:
        "The **outputs panel** displays your structured strategic plan — with goals, timelines, and responsible advisors.",
      howItWorks4:
        "Review and refine the plan, then export it as your north-star roadmap or execution guide.",
    },
    // Gideon – Data Strategist
    {
      name: "Business Plan Builder",
      mainAdvisorName: "Gideon",
      howItWorks1:
        "The Business Plan Builder turns your scattered company information into a polished, investor-ready plan.",
      howItWorks2:
        "In the **inputs panel**, add or upload business details — market, product, team, traction, and financial highlights.",
      howItWorks3:
        "The **outputs panel** generates a structured business plan draft organized by section. Expand to edit text or share for review.",
      howItWorks4:
        "Refine language with Gideon’s help, finalize sections, and export your complete business plan as PDF or doc.",
    },
    {
      name: "Company Abstract Creator",
      mainAdvisorName: "Gideon",
      howItWorks1:
        "The Company Abstract Creator helps you generate a clean, one-page summary of your business — ideal for investors, partners, or press.",
      howItWorks2:
        "In the **inputs panel**, add company highlights: what you do, your market, traction, and metrics.",
      howItWorks3:
        "The **outputs panel** produces a concise, elegant abstract that you can expand for full-screen editing.",
      howItWorks4:
        "Approve the final version and export or reuse it across pitch decks and communications.",
    },
    {
      name: "KPI Keeper",
      mainAdvisorName: "Gideon",
      howItWorks1:
        "The KPI Keeper tracks and organizes all your company’s key performance indicators in one place.",
      howItWorks2:
        "In the **inputs panel**, input metrics from each department or connect data sources.",
      howItWorks3:
        "The **outputs panel** shows dashboards and KPI summaries you can expand or export.",
      howItWorks4:
        "Review performance, update metrics regularly, and use insights to steer company decisions.",
    },
    // Jade – Modeling Ninja
    {
      name: "FP&A Analyzer",
      mainAdvisorName: "Jade",
      howItWorks1:
        "The FP&A Analyzer helps you review company performance and spot financial trends through automated insights.",
      howItWorks2:
        "In the **inputs panel**, upload financial statements or connect your model data. Choose the type of analysis you’d like to run.",
      howItWorks3:
        "The **outputs panel** presents key performance summaries and charts. Expand to full screen for deeper insights.",
      howItWorks4:
        "Export the analysis as a report or integrate the metrics into your financial dashboard.",
    },
    {
      name: "Gross Profit Analysis",
      mainAdvisorName: "Jade",
      howItWorks1:
        "The Gross Profit Analysis tool helps you break down margins across products, markets, or time periods.",
      howItWorks2:
        "Add your cost and revenue inputs in the **inputs panel** or link an existing model.",
      howItWorks3:
        "The **outputs panel** visualizes margin structure, trends, and improvement levers.",
      howItWorks4:
        "Save results or export them into your FP&A workbook for strategy alignment.",
    },
    {
      name: "Labor Cost Analyzer",
      mainAdvisorName: "Jade",
      howItWorks1:
        "The Labor Cost Analyzer evaluates your workforce costs and efficiency to optimize spend.",
      howItWorks2:
        "Provide headcount, salary, and functional cost inputs in the **inputs panel**.",
      howItWorks3:
        "The **outputs panel** displays breakdowns by department, cost centers, and trends.",
      howItWorks4:
        "Export summaries for budgeting, forecasting, or HR planning.",
    },
    {
      name: "Working Capital Analyzer",
      mainAdvisorName: "Jade",
      howItWorks1:
        "The Working Capital Analyzer helps you understand your liquidity position and cash flow levers.",
      howItWorks2:
        "Input your balance sheet data or connect accounting sources in the **inputs panel**.",
      howItWorks3:
        "The **outputs panel** highlights AR, AP, and inventory dynamics — expandable for deeper insight.",
      howItWorks4:
        "Use the report to optimize cash cycles and improve working capital efficiency.",
    },
    // Dante – Wall Street Insider
    {
      name: "Valuation Deck Builder",
      mainAdvisorName: "Dante",
      howItWorks1:
        "The Valuation Deck Builder helps you prepare polished investor materials — combining financials, metrics, and narrative.",
      howItWorks2:
        "Input company data, market comps, and valuation assumptions in the **inputs panel**.",
      howItWorks3:
        "The **outputs panel** shows your valuation deck outline and key visuals. Expand to review all slides.",
      howItWorks4:
        "Finalize content and export your investor-ready valuation presentation.",
    },
    {
      name: "Comparable Companies Analyzer",
      mainAdvisorName: "Dante",
      howItWorks1:
        "The Comparable Analyzer benchmarks your company against market peers.",
      howItWorks2:
        "In the **inputs panel**, specify your company type, sector, and relevant metrics.",
      howItWorks3:
        "The **outputs panel** lists comparables with valuation multiples and KPIs.",
      howItWorks4:
        "Export the results for inclusion in decks or financial models.",
    },
    {
      name: "Investor Targeting",
      mainAdvisorName: "Dante",
      howItWorks1:
        "The Investor Targeting tool identifies potential investors and firms aligned with your stage and market.",
      howItWorks2:
        "Provide company info and funding stage in the **inputs panel**.",
      howItWorks3:
        "The **outputs panel** displays a curated list of investors with profiles and contact details.",
      howItWorks4:
        "Save, export, or share your investor list to begin outreach.",
    },
    {
      name: "Credentials Builder",
      mainAdvisorName: "Dante",
      howItWorks1:
        "The Credentials Builder creates a polished page highlighting your firm’s past deals, achievements, and successes.",
      howItWorks2:
        "Upload deal data or summaries in the **inputs panel**.",
      howItWorks3:
        "The **outputs panel** generates a visual credentials page with tombstones and results.",
      howItWorks4:
        "Export as a PDF or slide for client and investor presentations.",
    },
    // Aria – Product Mentor
    {
      name: "Product Narrative Designer",
      mainAdvisorName: "Aria",
      howItWorks1:
        "The Product Narrative Designer helps you articulate the story behind your product — what it does, why it matters, and why it wins.",
      howItWorks2:
        "In the **inputs panel**, describe your product, target audience, and differentiators.",
      howItWorks3:
        "The **outputs panel** presents your refined narrative with positioning and tone.",
      howItWorks4:
        "Review and export for use in decks, websites, or marketing materials.",
    },
    {
      name: "Roadmap Builder",
      mainAdvisorName: "Aria",
      howItWorks1:
        "The Roadmap Builder transforms your vision into a clear, prioritized product plan.",
      howItWorks2:
        "In the **inputs panel**, list features, initiatives, and estimated impact.",
      howItWorks3:
        "The **outputs panel** visualizes roadmap by timeline or priority.",
      howItWorks4:
        "Finalize and export for internal planning or stakeholder sharing.",
    },
    // Salomon – Industry Sage
    {
      name: "Market Landscape Analyzer",
      mainAdvisorName: "Salomon",
      howItWorks1:
        "The Market Landscape Analyzer helps you understand your industry’s structure and competitors.",
      howItWorks2:
        "Add your sector, geography, and focus area in the **inputs panel**.",
      howItWorks3:
        "The **outputs panel** summarizes key players, trends, and insights.",
      howItWorks4:
        "Export a summary report to support strategic or investor discussions.",
    },
    {
      name: "Benchmark Researcher",
      mainAdvisorName: "Salomon",
      howItWorks1:
        "The Benchmark Researcher provides performance data from leading companies in your industry.",
      howItWorks2:
        "Select your market and metrics in the **inputs panel**.",
      howItWorks3:
        "The **outputs panel** shows benchmarks and comparisons.",
      howItWorks4:
        "Export or integrate into your internal KPI dashboards.",
    },
    // Lyra – Growth Alchemist
    {
      name: "Go-to-Market Builder",
      mainAdvisorName: "Lyra",
      howItWorks1:
        "The GTM Builder helps you design a go-to-market strategy — messaging, channels, and tactics for growth.",
      howItWorks2:
        "In the **inputs panel**, describe your audience, market, and goals.",
      howItWorks3:
        "The **outputs panel** presents your GTM framework and funnel design.",
      howItWorks4:
        "Review and export your GTM plan as a presentation or playbook.",
    },
    {
      name: "ICP & Segmentation Tool",
      mainAdvisorName: "Lyra",
      howItWorks1:
        "The ICP Tool defines your ideal customer profile and segmentation.",
      howItWorks2:
        "Input customer data, segments, or hypotheses in the **inputs panel**.",
      howItWorks3:
        "The **outputs panel** visualizes clusters and segment summaries.",
      howItWorks4:
        "Export segments for campaign planning or CRM targeting.",
    },
    // Vera – Legal Navigator
    {
      name: "Contract Simplifier",
      mainAdvisorName: "Vera",
      howItWorks1:
        "The Contract Simplifier turns complex agreements into easy-to-understand summaries.",
      howItWorks2:
        "Upload your document in the **inputs panel**.",
      howItWorks3:
        "The **outputs panel** presents the key terms, risks, and summaries.",
      howItWorks4:
        "Export or share for review before final legal approval.",
    },
    {
      name: "RIF Analyzer",
      mainAdvisorName: "Vera",
      howItWorks1:
        "The RIF Analyzer helps assess workforce reduction plans and their legal or structural implications.",
      howItWorks2:
        "Add workforce data and restructuring assumptions in the **inputs panel**.",
      howItWorks3:
        "The **outputs panel** displays compliance checks and legal considerations.",
      howItWorks4:
        "Review and export a compliance summary for HR and leadership teams.",
    },
    // Noa – People Architect
    {
      name: "Org Design Builder",
      mainAdvisorName: "Noa",
      howItWorks1:
        "The Org Design Builder helps you map and visualize your organizational structure.",
      howItWorks2:
        "In the **inputs panel**, define roles, teams, and reporting lines.",
      howItWorks3:
        "The **outputs panel** visualizes your org chart and hierarchy.",
      howItWorks4:
        "Export or update as your company grows.",
    },
    {
      name: "Hiring Blueprint",
      mainAdvisorName: "Noa",
      howItWorks1:
        "The Hiring Blueprint helps you identify hiring needs and priorities aligned with company goals.",
      howItWorks2:
        "In the **inputs panel**, describe current roles, skill gaps, or upcoming projects.",
      howItWorks3:
        "The **outputs panel** lists roles, job levels, and suggested sequencing.",
      howItWorks4:
        "Export your hiring plan for recruiting and budgeting.",
    },
  ];

  const norm = (s: string) => s.trim().toLowerCase();
  let created = 0;
  let updated = 0;

  for (const d of desired) {
    const existing = await prisma.record.findFirst({
      where: {
        collectionId: tools.id,
        data: { path: ["name"], equals: d.name },
      },
    });

    const advisorId = advisorIdByName[norm(d.mainAdvisorName)] ?? "";
    const payload = {
      name: d.name,
      mainAdvisorId: advisorId,
      howItWorks1: d.howItWorks1,
      howItWorks2: d.howItWorks2,
      howItWorks3: d.howItWorks3,
      howItWorks4: d.howItWorks4,
    } as const;

    if (existing) {
      await prisma.record.update({ where: { id: existing.id }, data: { data: payload } });
      updated++;
    } else {
      await prisma.record.create({ data: { collectionId: tools.id, data: payload } });
      created++;
    }
  }

  console.log(`Tools & Pages: created ${created}, updated ${updated}`);
}

async function seedCompaniesCollection() {
  const companies = await prisma.collection.findUnique({ where: { slug: "companies" } });
  if (!companies) return;

  const fields = [
    { label: "Name", key: "name", type: "text", required: true, order: 1 },
    { label: "Description", key: "description", type: "richtext", required: false, order: 2 },
    { label: "Raw Data", key: "rawData", type: "richtext", required: false, order: 3 },
    { label: "Data Map", key: "dataMap", type: "json", required: false, order: 4 },
    { label: "Business Classification", key: "businessClassification", type: "text", required: false, order: 5 },
    { label: "Business Classification - Additional Details", key: "businessClassificationDetails", type: "richtext", required: false, order: 6 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: companies.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: companies.id },
    });
  }
}

async function seedTasksCollection() {
  const tasks = await prisma.collection.findUnique({ where: { slug: "tasks" } });
  if (!tasks) return;

  const fields = [
    { label: "Name", key: "name", type: "text", required: true, order: 1 },
    { label: "Task Prompt", key: "taskPrompt", type: "text", required: false, order: 2 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: tasks.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: tasks.id },
    });
  }
}

async function seedSystemPromptsCollection() {
  const systemPrompts = await prisma.collection.findUnique({ where: { slug: "system-prompts" } });
  if (!systemPrompts) return;

  const fields = [
    { label: "Name", key: "name", type: "text", required: true, order: 1 },
    { label: "Content", key: "content", type: "richtext", required: true, order: 2 },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { collectionId_key: { collectionId: systemPrompts.id, key: f.key } },
      update: { ...f },
      create: { ...f, collectionId: systemPrompts.id },
    });
  }
}

async function main() {
  await ensureCollections();
  await seedAdvisorFields();
  await seedAdvisorRecords();
  await seedStructuresCollection();
  await seedStructureTemplates();
  await seedCompaniesCollection();
  await seedTasksCollection();
  await seedSystemPromptsCollection();
  await seedToolsPagesCollection();
  await seedToolsPagesRecords();
}

main()
  .then(async () => {
    console.log("✅ Seed complete");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
