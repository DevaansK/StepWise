import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// College Administrative Knowledge Base context for grounding Gemini
const COLLEGE_KNOWLEDGE_CONTEXT = `
You are the AI Administrative Advisor for "StepWise", a college administrative service and workflow automation platform.
Your role is to guide students on college administrative procedures, required documents, offices, processing timelines, and tracking requests.

Here is the verified college service catalogue:
1. Bonafide Certificate:
   - Department: Department of Academic Affairs & Records (Building B, Room 102)
   - Approving Authority: Dean of Academic Affairs
   - Processing Time: 2-3 business days
   - Required Documents: Current Semester ID Card copy, Latest Semester Fee Receipt
   - Procedure: Submit application stating purpose (bus pass, passport, visa, bank loan, internship). Academic staff verifies fee receipt and active enrollment status. Dean approves.

2. Academic Transcript:
   - Department: Controller of Examinations Office (Exam Tower, Floor 2)
   - Approving Authority: Controller of Examinations
   - Processing Time: 5-7 business days
   - Required Documents: Mark sheets of all completed semesters, Degree certificate / provisional copy (if alumnus), Library and Lab No-Dues clearance
   - Procedure: Fill semester breakdown, upload all semester grade sheets. Exam cell verifies credits and grades. Controller grants official embossed transcript.

3. Fee Receipt / Statement of Accounts:
   - Department: Finance & Student Accounts (Admin Block, Room 14)
   - Approving Authority: Finance Officer
   - Processing Time: 1-2 business days
   - Required Documents: Bank transaction proof or UTR acknowledgment, Student ID Card
   - Procedure: Select academic year, provide transaction reference. Finance desk audits payment gateway reconciliation. Stamped financial statement issued.

4. Student ID Card Replacement:
   - Department: Campus Security & Identity Services (Main Gate Complex)
   - Approving Authority: Chief Security Officer
   - Processing Time: 2-4 business days
   - Required Documents: Recent passport-size photograph (white background), Police missing report or declaration letter, Fee fine challan ($10)
   - Procedure: Upload FIR/loss undertaking, upload digital photo. Security department validates student record and prints smart RFID chip card.

5. Hostel Permission & Outpass:
   - Department: Hostel & Campus Housing Directorate (Campus Residence Office)
   - Approving Authority: Chief Warden
   - Processing Time: 1 business day (Fast-track)
   - Required Documents: Parent/Guardian consent letter/SMS acknowledgment, Hostel Resident ID card
   - Procedure: Specify departure date, destination, reason, and emergency contact. Hostel staff cross-verifies guardian consent. Warden issues digital gate pass.

6. Academic Leave Request:
   - Department: Department of Academic Affairs & Records (Building B, Room 102)
   - Approving Authority: Head of Department & Dean
   - Processing Time: 2-3 business days
   - Required Documents: Medical fitness/doctor's certificate (for health leave) OR official event invitation/sports sanction letter
   - Procedure: State leave duration and dates. Faculty advisor and HOD review attendance threshold. Dean confirms excused absence.

7. Institutional No-Dues Clearance:
   - Department: Finance & Student Accounts (Admin Block, Room 14)
   - Approving Authority: Registrar
   - Processing Time: 3-5 business days
   - Required Documents: Library clearance slip, Department lab clearance, Sports/Gymkhana clearance, Hostel clearance
   - Procedure: Initiate single-window digital clearance. Departments verify zero outstanding dues. Registrar issues No-Dues Certificate for graduation or transfer.

8. Contact & Address Update:
   - Department: Department of Academic Affairs & Records (Building B, Room 102)
   - Approving Authority: Academic Registrar
   - Processing Time: 1-2 business days
   - Required Documents: Government address proof (Aadhar/Passport/Driver License), Parent concurrence letter
   - Procedure: Submit new permanent/correspondence address. Records staff updates student ERP and identity records.

Workflow States in StepWise:
- Draft -> Submitted -> Under Verification -> Additional Information Required (if documents are incomplete or unclear) -> Verified -> Pending Approval -> Approved / Rejected -> Completed.

Behavior Guidelines:
- Be concise, structured, friendly, and practical.
- Use bullet points for steps and document checklists.
- Always mention the responsible department, required documents, and estimated days.
- If the user asks about an unknown service or asks for official legal/financial guarantees, state clearly that this information is illustrative and advise contacting the relevant college department directly.
- Include action recommendations like "You can start this request right now under 'Browse Services' > 'Start Request'".
`;

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// AI Assistant chat endpoint
app.post('/api/assistant', async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  // If Gemini API key is available, use Gemini 3.8 Flash
  if (ai) {
    try {
      // Build conversation contents
      const conversationContents: any[] = [];

      // Add recent history if provided
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item.sender === 'user') {
            conversationContents.push({ role: 'user', parts: [{ text: item.text }] });
          } else if (item.sender === 'assistant') {
            conversationContents.push({ role: 'model', parts: [{ text: item.text }] });
          }
        }
      }

      // Add the latest message
      conversationContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: conversationContents,
        config: {
          systemInstruction: COLLEGE_KNOWLEDGE_CONTEXT,
          temperature: 0.3,
        },
      });

      const replyText = response.text || 'I could not generate a response. Please try again.';

      // Detect relevant service from message/reply
      let relatedServiceId: string | null = null;
      const lower = (message + ' ' + replyText).toLowerCase();
      if (lower.includes('bonafide')) relatedServiceId = 'srv-bonafide';
      else if (lower.includes('transcript')) relatedServiceId = 'srv-transcript';
      else if (lower.includes('fee receipt') || lower.includes('fee statement')) relatedServiceId = 'srv-fee';
      else if (lower.includes('id card') || lower.includes('identity card')) relatedServiceId = 'srv-id-card';
      else if (lower.includes('hostel') || lower.includes('outpass')) relatedServiceId = 'srv-hostel';
      else if (lower.includes('leave')) relatedServiceId = 'srv-leave';
      else if (lower.includes('no-dues') || lower.includes('no dues')) relatedServiceId = 'srv-nodues';
      else if (lower.includes('address') || lower.includes('contact')) relatedServiceId = 'srv-address';

      return res.json({
        reply: replyText,
        relatedServiceId,
        source: 'gemini-3.8-flash',
        isDemoMode: false,
      });
    } catch (err: any) {
      console.error('Error invoking Gemini API:', err);
      // Fallback gracefully to local advisor
    }
  }

  // Deterministic Mock College Advisor fallback (used when GEMINI_API_KEY is not set or network fails)
  const lowerQuery = message.toLowerCase();
  let fallbackReply = '';
  let relatedServiceId: string | null = null;

  if (lowerQuery.includes('bonafide')) {
    relatedServiceId = 'srv-bonafide';
    fallbackReply = `### Applying for a Bonafide Certificate

**Responsible Department:** Department of Academic Affairs & Records (Building B, Room 102)
**Approving Authority:** Dean of Academic Affairs
**Estimated Processing Time:** 2-3 business days

**Step-by-Step Procedure:**
1. Navigate to **Browse Services** and select **Bonafide Certificate**.
2. Specify your purpose (e.g., Passport application, Bank loan, State scholarship, Bus concession).
3. Upload your **Current Semester ID Card** copy and **Latest Fee Receipt**.
4. Submit the request to receive your tracking ID (e.g., \`SW-2026-0004\`).
5. Academic staff will verify your fee status and attendance, then forward to the Dean for digital endorsement.`;
  } else if (lowerQuery.includes('transcript')) {
    relatedServiceId = 'srv-transcript';
    fallbackReply = `### Requesting an Official Academic Transcript

**Responsible Department:** Controller of Examinations Office (Exam Tower, Floor 2)
**Approving Authority:** Controller of Examinations
**Estimated Processing Time:** 5-7 business days

**Required Documents Checklist:**
- Copies of mark sheets for all completed semesters
- Provisional or final degree certificate (for alumni)
- Library and departmental lab clearance acknowledgment

**Procedure:**
1. Choose **Academic Transcript** from the service catalogue.
2. Indicate the number of attested copies and receiving university/institution details.
3. Attach scanned PDFs of each semester grade sheet.
4. Once verified by the examination team, the Controller signs and stamps the official transcript.`;
  } else if (lowerQuery.includes('fee') || lowerQuery.includes('receipt') || lowerQuery.includes('statement')) {
    relatedServiceId = 'srv-fee';
    fallbackReply = `### Obtaining an Official Fee Receipt / Statement

**Responsible Department:** Finance & Student Accounts (Admin Block, Room 14)
**Approving Authority:** Finance Officer
**Estimated Processing Time:** 1-2 business days

**Required Details:**
- Academic Year and Semester
- Bank transaction reference number / UTR ID
- Proof of payment (bank transfer screenshot or deposit challan)

**Next Steps:**
Submit the request through StepWise to have Accounts reconcile your payment and issue an officially stamped statement.`;
  } else if (lowerQuery.includes('id card') || lowerQuery.includes('lost card') || lowerQuery.includes('replacement')) {
    relatedServiceId = 'srv-id-card';
    fallbackReply = `### Replacing a Lost or Damaged Student ID Card

**Responsible Department:** Campus Security & Identity Services (Main Gate Complex)
**Approving Authority:** Chief Security Officer
**Estimated Processing Time:** 2-4 business days

**Required Documents:**
- High-resolution passport-style photo (white background)
- Police lost article report / signed loss declaration
- Replacement fee receipt ($10 / ₹500 standard replacement fine)

Security prints a new NFC smart card and activates library and turnstile access automatically.`;
  } else if (lowerQuery.includes('status') || lowerQuery.includes('track') || lowerQuery.includes('check')) {
    fallbackReply = `### How to Track Your Request on StepWise

You can track all submitted requests in real time:
1. Go to **My Requests** in the left navigation sidebar.
2. Click on any request card or row to open the **Request Details & Tracking Timeline**.
3. The vertical progress tracker displays every completed step:
   - **Submitted**: Request received by system.
   - **Under Verification**: Assigned department staff is checking your files.
   - **Additional Info Required**: If an officer queries a document, you can upload a corrected file directly from the tracking page.
   - **Pending Approval**: Verified and awaiting Dean/Director sign-off.
   - **Approved / Completed**: Ready for download with official digital seal!`;
  } else if (lowerQuery.includes('incomplete') || lowerQuery.includes('document') || lowerQuery.includes('additional')) {
    fallbackReply = `### Incomplete Documents or Information Queries

If department staff mark your request as **"Additional Information Required"**:
1. You will receive an instant notification in your top navigation center.
2. Open the request in **My Requests** to view the staff officer's specific query.
3. Use the **Upload Additional Document** form on the request page to attach the missing file or add clarifying notes.
4. Click **Resubmit Response** — the status returns to *Under Verification* immediately.`;
  } else if (lowerQuery.includes('hostel') || lowerQuery.includes('outpass') || lowerQuery.includes('leave')) {
    relatedServiceId = 'srv-hostel';
    fallbackReply = `### Hostel Leave & Outpass Permissions

**Responsible Department:** Hostel & Campus Housing Directorate (Campus Residence Office)
**Approving Authority:** Chief Warden
**Estimated Processing Time:** Within 24 hours

**Required Documentation:**
- Parent / Guardian consent confirmation (SMS/call record or signed letter)
- Resident student ID

Ensure your outpass request is submitted at least 24 hours prior to travel.`;
  } else if (lowerQuery.includes('no-dues') || lowerQuery.includes('no dues')) {
    relatedServiceId = 'srv-nodues';
    fallbackReply = `### Institutional No-Dues Clearance

**Responsible Department:** Finance & Student Accounts (Admin Block, Room 14)
**Approving Authority:** Registrar
**Estimated Processing Time:** 3-5 business days

This service consolidates clearance from the Central Library, Departmental Labs, Hostel Office, and Accounts section. Required prior to provisional degree issuance or institutional transfer.`;
  } else {
    fallbackReply = `### Welcome to StepWise College Administrative Guidance!

I can help you navigate procedures, documentation, and routing for any college service:
- **Bonafide Certificates** (purpose letters, bank loan letters, passport proof)
- **Academic Transcripts & Grade Sheets** (verification & attested copies)
- **Fee Statements & Payment Receipts** (financial audits & scholarship claims)
- **Student ID Card Replacement** (lost or damaged smart cards)
- **Hostel Outpass & Permissions** (night leaves and weekend travels)
- **Medical / Academic Leave Approvals** (attendance condonation)
- **Institutional No-Dues Clearance** (graduation and transfer)

*Tip:* You can ask me questions like *"What documents do I need for a bonafide certificate?"* or click any of the suggested prompt pills below.`;
  }

  return res.json({
    reply: fallbackReply,
    relatedServiceId,
    source: 'college-knowledge-base',
    isDemoMode: true,
  });
});

// Serve frontend in production or mount Vite middleware in development
async function start() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StepWise server running on port ${PORT} (dev: ${!isProd})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
