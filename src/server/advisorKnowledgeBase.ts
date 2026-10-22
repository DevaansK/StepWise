/**
 * StepWise College Administrative Knowledge Base & Advisor Intelligence
 * 
 * Provides verified administrative rules, service procedures, required documents,
 * and deterministic grounded answers for college services.
 */

export const COLLEGE_KNOWLEDGE_SYSTEM_PROMPT = `
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
   - Required Documents: Mark sheets of all completed semesters (PDF), Degree certificate / provisional copy (if alumnus), Library and Lab No-Dues clearance
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
   - Required Documents: Recent passport-size photograph (white background), Police missing report or loss declaration undertaking, Fee challan / fine receipt ($10)
   - Procedure: Upload loss undertaking, upload digital photo. Security department validates student record and prints smart RFID chip card.

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
- Draft -> Submitted -> Under Verification -> Additional Information Required (if documents are incomplete or queried) -> Verified -> Pending Approval -> Approved / Rejected -> Completed.

Behavior Guidelines:
- Be concise, structured, friendly, and practical.
- Use markdown headings, bullet points for steps and document checklists.
- Always mention the responsible department, required documents, and estimated days.
- State that official policies are governed by college bylaws.
- Suggest "Browse Services > Start Request" when user is ready.
`;

export interface AdvisorResponse {
  reply: string;
  relatedServiceId: string | null;
  source: string;
  isDemoMode: boolean;
  isFallback?: boolean;
}

/**
 * Deterministic knowledge-base query matcher
 * Resolves questions with complete fidelity when Gemini is unavailable, rate-limited, or in test mode.
 */
export function getKnowledgeBaseAnswer(message: string): AdvisorResponse {
  const q = message.toLowerCase().trim();
  let relatedServiceId: string | null = null;
  let reply = '';

  if (q.includes('bonafide')) {
    relatedServiceId = 'srv-bonafide';
    reply = `### How to Apply for a Bonafide Certificate

**Responsible Department:** Department of Academic Affairs & Records (Building B, Room 102)  
**Approving Authority:** Dean of Academic Affairs  
**Estimated Processing Time:** 2–3 business days  

#### Required Documents Checklist:
* **Current Semester Student ID Card** (scanned copy or photo in PDF/JPG/PNG, max 5MB)
* **Latest Semester Fee Payment Receipt** (PDF/JPG, max 5MB)

#### Step-by-Step Procedure:
1. Navigate to **Browse Services** in the sidebar.
2. Select **Bonafide Certificate** and click **Start Request**.
3. Specify your certificate purpose (e.g., passport application, educational loan, visa processing, internship, or bus concession).
4. Upload your student ID card scan and latest fee receipt.
5. Review your application and submit to receive your unique tracking reference (e.g. \`SW-2026-0004\`).
6. Academic Affairs staff will verify your enrollment and tuition status before forwarding to the Dean for digital sign-off and seal.`;
  } else if (q.includes('transcript')) {
    relatedServiceId = 'srv-transcript';
    reply = `### Required Documents & Procedure for an Academic Transcript

**Responsible Department:** Controller of Examinations Office (Exam Tower, 2nd Floor)  
**Approving Authority:** Controller of Examinations  
**Estimated Processing Time:** 5–7 business days  

#### Required Documents Checklist:
* **Mark Sheets of All Completed Semesters** (Consolidated PDF, max 10MB)
* **Degree / Provisional Certificate** (Mandatory for alumni; PDF/JPG, max 5MB)
* **Library & Departmental Lab No-Dues Clearance** (PDF/JPG, max 3MB)

#### Step-by-Step Procedure:
1. Open **Browse Services** > **Academic Transcript**.
2. Specify the total number of official sealed copies required and recipient university/employer addresses.
3. Attach the consolidated semester grade reports and clearance confirmation.
4. The Examinations Audit Desk reconciles database records against tabulations.
5. The Controller of Examinations applies the institutional holographic seal and issues the verified transcript.`;
  } else if (q.includes('status') || q.includes('track') || q.includes('check')) {
    reply = `### How to Check and Track Your Request Status

You can monitor every stage of your administrative request in real time on StepWise:

1. Click **My Requests** in the left navigation sidebar.
2. Select any request card or table row to open the **Request Details & Tracking Timeline**.
3. The vertical status tracker shows current progress across all stages:
   * **Submitted:** Request received and placed in the departmental queue.
   * **Under Verification:** Department staff is inspecting submitted documents and records.
   * **Additional Information Required:** If an officer flags an incomplete file or has a question, you can reply directly on the page and attach supplemental documents.
   * **Pending Approval:** Documents verified; awaiting Dean, Warden, or Registrar executive signature.
   * **Approved / Completed:** Digital certificate with official stamp and verification QR code is generated for download.`;
  } else if (q.includes('no-dues') || q.includes('no dues') || q.includes('clearance')) {
    relatedServiceId = 'srv-nodues';
    reply = `### Department Handling Institutional No-Dues Clearance

**Responsible Department:** Finance & Student Accounts (Admin Block, Room 14)  
**Approving Authority:** University Registrar  
**Estimated Processing Time:** 3–5 business days  

#### Clearance Sections Covered:
* Central Library (book returns and fine clearance)
* Academic Department & Laboratories (equipment, lockers, and project returns)
* Campus Residence & Hostel Office (room handover and mess dues)
* Finance & Accounts Section (final fee audit)

#### Next Steps:
Go to **Browse Services** > **Institutional No-Dues Clearance** to initiate a single-window digital clearance request before graduation or transfer.`;
  } else if (q.includes('incomplete') || q.includes('missing') || q.includes('query') || q.includes('additional')) {
    reply = `### What to Do If Your Documents Are Incomplete

If department staff mark your application as **"Additional Information Required"**:

1. **Check Your Notifications:** An in-app alert is generated detailing the staff member's remarks (e.g., *"Library clearance slip is required"*).
2. **Open Request Details:** Navigate to **My Requests** and click on the flagged request.
3. **Review the Staff Query:** The highlighted alert banner will state exactly which document is missing or requires clarification.
4. **Attach Missing Files:** Use the **"Upload Supplemental File"** input box on the detail screen.
5. **Enter Clarification Remarks:** Type an explanation in the response field.
6. **Click "Resubmit Response":** The request status automatically returns to **Under Verification** for immediate priority re-examination.`;
  } else if (q.includes('id card') || q.includes('lost card') || q.includes('replacement')) {
    relatedServiceId = 'srv-id-card';
    reply = `### Replacing a Lost or Damaged Student ID Card

**Responsible Department:** Campus Security & Identity Services (Main Gate Complex)  
**Approving Authority:** Chief Security Officer  
**Estimated Processing Time:** 2–4 business days  

#### Required Documents:
* **Recent Formal Passport-Size Photograph** (plain white background; JPG/PNG, max 4MB)
* **Police Lost Article Report or Signed Declaration Undertaking** (PDF/JPG, max 5MB)
* **Replacement Fee Challan / Receipt** ($10 / ₹500 standard replacement fine)

#### Procedure:
1. Open **Browse Services** > **Student ID Card Replacement**.
2. Select replacement reason (*Lost*, *Damaged*, or *Defective RFID Chip*).
3. Upload your digital photograph and loss declaration.
4. Security Identity Services programs a new NFC smart card and reactivates turnstile access.`;
  } else if (q.includes('fee') || q.includes('receipt') || q.includes('statement')) {
    relatedServiceId = 'srv-fee';
    reply = `### Obtaining an Official Fee Receipt or Statement of Accounts

**Responsible Department:** Finance & Student Accounts (Admin Block, Room 14)  
**Approving Authority:** Finance Officer  
**Estimated Processing Time:** 1–2 business days  

#### Required Details:
* Academic Year and Semester
* Bank Transaction Reference / UTR Number
* Payment Proof Screenshot or Deposit Challan

Submit through **Browse Services** > **Fee Receipt / Statement** for audited, stamped documentation.`;
  } else if (q.includes('grievance') || q.includes('grade') || q.includes('revaluation') || q.includes('recheck')) {
    reply = `### Grade Grievance & Revaluation Appeals
**Responsible Department:** Controller of Examinations Office & Academic Appeals Committee (Exam Tower, 2nd Floor)  
**Approving Authority:** Controller of Examinations & Dean of Academic Affairs  
**Estimated Processing Time:** 7–10 business days  

#### Grievance Rules & Guidelines:
1. **Filing Window:** Academic appeals must be lodged within **14 calendar days** of official semester result publication.
2. **Required Documents:** Consolidated semester grade sheet, exam hall ticket copy, and fee receipt for the re-evaluation verification deposit.
3. **Review Process:** The paper is audited by an independent external subject examiner. Any revision is signed off by the Controller of Examinations and updated in the official transcript registry.`;
  } else if (q.includes('cancel') || q.includes('withdraw') || q.includes('delete request')) {
    reply = `### Cancellation & Withdrawal of Submitted Requests

#### StepWise Request Cancellation Policy:
* **Draft & Submitted Stages:** You can cancel or modify your application directly from the **My Requests** overview before departmental processing commences.
* **Under Verification & Pending Approval:** Once an administrative officer begins active scrutiny, self-service cancellation is locked to maintain audit trail integrity. To withdraw a request at this stage, open the request details, add a comment requesting withdrawal in the response box, or email the responsible department desk with your tracking ID.
* **Approved / Completed:** Completed digital certificates and official institutional dispatches cannot be retracted.`;
  } else if (q.includes('hostel') || q.includes('outpass') || q.includes('leave')) {
    relatedServiceId = 'srv-hostel';
    reply = `### Hostel Leave & Outpass Permissions

**Responsible Department:** Hostel & Campus Housing Directorate (Campus Residence Office)  
**Approving Authority:** Chief Warden  
**Estimated Processing Time:** Within 24 hours (Fast-track)  

#### Required Documents:
* Parent / Guardian Consent Letter or SMS Acknowledgment
* Resident Student ID

Submit travel dates and emergency contact under **Browse Services** > **Hostel Outpass & Permission**.`;
  } else {
    reply = `### Welcome to StepWise College Administrative Guidance!

I can help you navigate institutional procedures, required documents, offices, and tracking rules:
* **Bonafide Certificates** (purpose letters, loan letters, passport proof)
* **Academic Transcripts & Grade Sheets** (verification & official sealed copies)
* **Fee Statements & Payment Receipts** (financial audits & scholarship claims)
* **Student ID Card Replacement** (lost or damaged smart cards)
* **Hostel Outpass & Permissions** (night leaves and weekend travels)
* **Academic Leave Approvals** (medical and official absences)
* **Institutional No-Dues Clearance** (graduation and transfer)

You can ask me questions like *"How do I apply for a bonafide certificate?"* or *"What documents are required for an academic transcript?"*`;
  }

  return {
    reply,
    relatedServiceId,
    source: 'college-knowledge-base',
    isDemoMode: true,
    isFallback: true,
  };
}
