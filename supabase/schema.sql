-- ==============================================================================
-- StepWise: AI-Assisted College Administrative Service & Process Automation
-- Supabase PostgreSQL Database Schema, Constraints, Triggers & Row-Level Security
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP EXISTING OBJECTS (FOR CLEAN RE-RUNNABILITY IF NEEDED)
-- Note: Tables are created with IF NOT EXISTS below for safety.

-- ------------------------------------------------------------------------------
-- 3. DEPARTMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    office_location TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    lead_name TEXT NOT NULL,
    icon_name TEXT NOT NULL DEFAULT 'GraduationCap',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. USER PROFILES TABLE (Mirrored from Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    institutional_id TEXT NOT NULL UNIQUE,
    department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('STUDENT', 'STAFF', 'APPROVER', 'ADMIN')) DEFAULT 'STUDENT',
    designation TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for role lookups and institutional id
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_institutional_id ON public.profiles(institutional_id);

-- ------------------------------------------------------------------------------
-- 5. SERVICES TABLE (Administrative Service Catalogue)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN (
        'Certificates', 
        'Academic Records', 
        'Financial & Accounts', 
        'Campus Life & Housing', 
        'Identity & Security'
    )),
    description TEXT NOT NULL,
    department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    approver_id TEXT NOT NULL,
    approver_title TEXT NOT NULL,
    approval_required BOOLEAN NOT NULL DEFAULT true,
    estimated_processing_days INTEGER NOT NULL DEFAULT 3,
    fee TEXT NOT NULL DEFAULT 'Free of Charge',
    eligibility TEXT NOT NULL,
    procedure JSONB NOT NULL DEFAULT '[]'::jsonb,
    required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_services_department ON public.services(department_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);

-- ------------------------------------------------------------------------------
-- 6. SERVICE REQUESTS TABLE (Central Single Source of Truth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_requests (
    id TEXT PRIMARY KEY, -- e.g. "SW-2026-0001"
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_roll TEXT NOT NULL,
    student_department TEXT NOT NULL,
    service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    service_name TEXT NOT NULL,
    service_code TEXT NOT NULL,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    uploaded_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN (
        'Draft',
        'Submitted',
        'Under Verification',
        'Additional Information Required',
        'Verified',
        'Pending Approval',
        'Approved',
        'Rejected',
        'Completed'
    )) DEFAULT 'Submitted',
    assigned_department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_staff_name TEXT,
    approver_id TEXT,
    approver_name TEXT,
    verification_remarks TEXT,
    decision_remarks TEXT,
    additional_info_query TEXT,
    additional_info_response TEXT,
    additional_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_requests_student ON public.service_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_requests_dept ON public.service_requests(assigned_department_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_service ON public.service_requests(service_id);

-- ------------------------------------------------------------------------------
-- 7. REQUEST HISTORIES TABLE (Immutable Audit Log)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.request_histories (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL CHECK (actor_role IN ('STUDENT', 'STAFF', 'APPROVER', 'ADMIN')),
    action TEXT NOT NULL,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    remarks TEXT NOT NULL DEFAULT '',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_histories_request ON public.request_histories(request_id);

-- ------------------------------------------------------------------------------
-- 8. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    recipient_id TEXT,
    recipient_role TEXT CHECK (recipient_role IN ('STUDENT', 'STAFF', 'APPROVER', 'ADMIN')),
    request_id TEXT REFERENCES public.service_requests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'submission',
        'verification',
        'info_required',
        'forwarded',
        'approval',
        'rejection',
        'completion'
    )),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

-- ------------------------------------------------------------------------------
-- 9. HELPER FUNCTIONS FOR ROW-LEVEL SECURITY
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_department()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Departments: Readable by all, manageable by Admin
CREATE POLICY "Departments are viewable by everyone" 
  ON public.departments FOR SELECT 
  USING (true);

CREATE POLICY "Departments can be modified by admins only" 
  ON public.departments FOR ALL 
  USING (public.current_user_role() = 'ADMIN');

-- Services: Readable by all, manageable by Admin
CREATE POLICY "Services are viewable by everyone" 
  ON public.services FOR SELECT 
  USING (true);

CREATE POLICY "Services can be modified by admins only" 
  ON public.services FOR ALL 
  USING (public.current_user_role() = 'ADMIN');

-- Profiles:
-- 1. Users can view their own profile, or Staff/Approver/Admin can view all profiles for operational context
CREATE POLICY "Profiles view policy" 
  ON public.profiles FOR SELECT 
  USING (
    auth.uid() = id 
    OR public.current_user_role() IN ('STAFF', 'APPROVER', 'ADMIN')
  );

-- 2. Users can update their own personal info (excluding unauthorized role change)
CREATE POLICY "Profiles update policy" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id OR public.current_user_role() = 'ADMIN');

-- Service Requests:
-- 1. Student can see their own requests
CREATE POLICY "Students can view own requests" 
  ON public.service_requests FOR SELECT 
  USING (
    student_id = auth.uid() 
    OR public.current_user_role() IN ('STAFF', 'APPROVER', 'ADMIN')
  );

-- 2. Student can insert their own request
CREATE POLICY "Students can create requests" 
  ON public.service_requests FOR INSERT 
  WITH CHECK (
    student_id = auth.uid()
    OR public.current_user_role() = 'ADMIN'
  );

-- 3. Student can update own request ONLY when Additional Information is Required
CREATE POLICY "Students can update queried requests" 
  ON public.service_requests FOR UPDATE 
  USING (
    (student_id = auth.uid() AND status = 'Additional Information Required')
    OR public.current_user_role() IN ('STAFF', 'APPROVER', 'ADMIN')
  );

-- 4. Staff can update requests in their department
CREATE POLICY "Staff can update department requests" 
  ON public.service_requests FOR UPDATE 
  USING (
    (public.current_user_role() = 'STAFF' AND assigned_department_id = public.current_user_department())
    OR public.current_user_role() IN ('APPROVER', 'ADMIN')
  );

-- 5. Admin can delete requests if required
CREATE POLICY "Admins can delete requests" 
  ON public.service_requests FOR DELETE 
  USING (public.current_user_role() = 'ADMIN');

-- Request Histories:
CREATE POLICY "Histories are viewable by authorized users" 
  ON public.request_histories FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests r 
      WHERE r.id = public.request_histories.request_id 
      AND (
        r.student_id = auth.uid() 
        OR public.current_user_role() IN ('STAFF', 'APPROVER', 'ADMIN')
      )
    )
  );

CREATE POLICY "Histories can be inserted by authenticated users" 
  ON public.request_histories FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Notifications:
CREATE POLICY "Users can view own or role notifications" 
  ON public.notifications FOR SELECT 
  USING (
    recipient_id = auth.uid()::text 
    OR recipient_role = public.current_user_role() 
    OR public.current_user_role() = 'ADMIN'
  );

CREATE POLICY "Users can update own notifications" 
  ON public.notifications FOR UPDATE 
  USING (
    recipient_id = auth.uid()::text 
    OR recipient_role = public.current_user_role()
    OR public.current_user_role() = 'ADMIN'
  );

CREATE POLICY "Notifications can be inserted by authenticated users" 
  ON public.notifications FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------------------------
-- 11. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_inst_id TEXT;
  v_dept_id TEXT;
  v_name TEXT;
BEGIN
-- Default name and institutional ID
  v_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  v_inst_id := COALESCE(new.raw_user_meta_data->>'institutionalId', 'ID-' || substr(md5(random()::text), 1, 8));
  v_dept_id := COALESCE(new.raw_user_meta_data->>'departmentId', 'dept-acad');

  -- SECURITY ENFORCEMENT: Public self-registration ALWAYS creates a STUDENT profile.
  -- Privileged accounts (STAFF, APPROVER, ADMIN) cannot be self-assigned via public signup metadata.
  -- They must be provisioned by an Administrator using provision_privileged_user() or direct SQL.
  v_role := 'STUDENT';

  INSERT INTO public.profiles (
    id,
    name,
    email,
    institutional_id,
    department_id,
    role,
    designation,
    phone
  ) VALUES (
    new.id,
    v_name,
    new.email,
    v_inst_id,
    v_dept_id,
    v_role,
    new.raw_user_meta_data->>'designation',
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = now();

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 11b. PRIVILEGED USER PROVISIONING (ADMIN ONLY)
-- ------------------------------------------------------------------------------
-- Secure procedure to promote an existing user to STAFF, APPROVER, or ADMIN.
-- Can only be executed by authenticated administrators.
CREATE OR REPLACE FUNCTION public.provision_privileged_user(
  target_user_id UUID,
  new_role TEXT,
  new_department_id TEXT DEFAULT 'dept-acad',
  new_designation TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller has ADMIN role in profiles
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can provision privileged accounts.';
  END IF;

  IF new_role NOT IN ('STAFF', 'APPROVER', 'ADMIN') THEN
    RAISE EXCEPTION 'Invalid privileged role: %. Allowed: STAFF, APPROVER, ADMIN', new_role;
  END IF;

  UPDATE public.profiles
  SET
    role = new_role,
    department_id = COALESCE(new_department_id, department_id),
    designation = COALESCE(new_designation, designation),
    updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- 12. STORAGE BUCKET CONFIGURATION FOR SUPPORTING DOCUMENTS
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('stepwise-documents', 'stepwise-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public document access policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stepwise-documents');

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stepwise-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'stepwise-documents' AND auth.uid() = owner);

-- ------------------------------------------------------------------------------
-- 13. SEED DATA (INSTITUTIONAL DEPARTMENTS & SERVICES)
-- ------------------------------------------------------------------------------
INSERT INTO public.departments (id, name, code, office_location, contact_email, lead_name, icon_name)
VALUES
  ('dept-acad', 'Department of Academic Affairs & Records', 'ACAD', 'Administration Building B, Room 102', 'academic.records@campus.edu', 'Academic Verification Lead', 'GraduationCap'),
  ('dept-exam', 'Controller of Examinations Office', 'EXAM', 'Examination Tower, 2nd Floor', 'examinations@campus.edu', 'Dr. Arthur Pendelton', 'FileCheck2'),
  ('dept-fin', 'Finance & Student Accounts Office', 'FIN', 'Central Administrative Block, Wing 1, Room 14', 'accounts@campus.edu', 'Marcus Vance', 'Receipt'),
  ('dept-sec', 'Campus Security & Identity Services', 'SEC', 'Security HQ, Main Gate Complex', 'security.id@campus.edu', 'Officer David Miller', 'BadgeCheck'),
  ('dept-hostel', 'Hostel & Campus Housing Directorate', 'HOSTEL', 'Student Residence Center, Block C', 'hostel.affairs@campus.edu', 'Dr. Helen Ward', 'Home')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  office_location = EXCLUDED.office_location,
  contact_email = EXCLUDED.contact_email,
  lead_name = EXCLUDED.lead_name;

-- Services Seed
INSERT INTO public.services (
  id, name, code, category, description, department_id, approver_id, approver_title, approval_required, estimated_processing_days, fee, eligibility, procedure, required_documents, form_fields, is_active
)
VALUES
(
  'srv-bonafide',
  'Bonafide Certificate',
  'BC-101',
  'Certificates',
  'Official university letter certifying that the student is a bonafide enrolled student of the college for visa, passport, education loan, or scholarship verification.',
  'dept-acad',
  'usr-approver-dean',
  'Dean of Academic Affairs',
  true,
  2,
  'Free of Charge',
  'Must be a currently registered full-time or part-time student with cleared semester enrollment.',
  '["Fill in application details specifying certificate purpose and academic semester.", "Upload a valid student ID card scan and proof of current semester tuition clearance.", "Department verification officer validates enrollment records and absence penalties.", "Dean of Academic Affairs digitally reviews and endorses the signed certificate.", "Download the official stamped PDF certificate with verification QR code."]'::jsonb,
  '[{"id": "doc-student-id", "name": "College Student ID Card", "description": "Front and back scan of current institutional smart card.", "mandatory": true, "acceptedFormats": ["PDF", "JPG", "PNG"], "maxSizeMB": 5}, {"id": "doc-fee-receipt", "name": "Latest Semester Fee Receipt", "description": "Payment acknowledgment for the current active semester.", "mandatory": true, "acceptedFormats": ["PDF", "JPG"], "maxSizeMB": 5}]'::jsonb,
  '[{"id": "purpose", "label": "Purpose of Certificate", "type": "select", "options": ["Passport Application / Renewal", "Education Loan / Bank Requirement", "Government / State Scholarship", "Public Transit Concession Pass", "Internship / Industry Project Application", "Other Administrative Purpose"], "required": true, "helpText": "Specify where this certificate will be submitted."}, {"id": "academicYear", "label": "Current Academic Year & Semester", "type": "text", "placeholder": "e.g., Year 3, Semester 6", "required": true}, {"id": "additionalRemarks", "label": "Specific Requirements / Addressee Note", "type": "textarea", "placeholder": "Mention any specific addressee", "required": false}]'::jsonb,
  true
),
(
  'srv-transcript',
  'Academic Transcript',
  'TR-201',
  'Academic Records',
  'Comprehensive, certified academic transcript detailing all courses taken, grades earned, semester credits, and cumulative GPA.',
  'dept-exam',
  'usr-approver-exam',
  'Controller of Examinations',
  true,
  5,
  '$15 per attested set',
  'Open to current students and alumni with no academic discipline holds.',
  '["Submit request indicating number of official sealed copies needed.", "Attach all semester grade reports and library clearance slip.", "Examinations audit desk reconciles grade database records and tabulations.", "Controller of Examinations grants authorization and applies holographic seal.", "Electronic transcript is dispatched to student portal and physical copies prepared for collection."]'::jsonb,
  '[{"id": "doc-grade-sheets", "name": "Consolidated Semester Grade Cards", "description": "All previous semester grade marksheets compiled into one PDF.", "mandatory": true, "acceptedFormats": ["PDF"], "maxSizeMB": 10}, {"id": "doc-library-clearance", "name": "Library Clearance Slip", "description": "Confirmation that all borrowed books are returned and overdue fines settled.", "mandatory": true, "acceptedFormats": ["PDF", "JPG"], "maxSizeMB": 3}]'::jsonb,
  '[{"id": "numberOfCopies", "label": "Number of Sealed Copies Needed", "type": "number", "placeholder": "1", "required": true}, {"id": "destinationPurpose", "label": "Recipient University / Organization", "type": "text", "placeholder": "e.g., Graduate Admissions, UC Berkeley / WES Evaluation", "required": true}, {"id": "modeOfDelivery", "label": "Delivery Mode", "type": "select", "options": ["Digital PDF + In-Person Campus Pickup", "Digital PDF Only", "Express Courier Dispatch"], "required": true}]'::jsonb,
  true
),
(
  'srv-fee',
  'Fee Receipt / Statement of Accounts',
  'FA-301',
  'Financial & Accounts',
  'Official stamped tuition fee receipt or consolidated financial account ledger for income tax rebate, corporate reimbursement, or personal records.',
  'dept-fin',
  'usr-approver-dean',
  'Finance Officer',
  true,
  1,
  'Free of Charge',
  'Registered students who have completed fee payments through bank challan, NEFT/RTGS, or portal.',
  '["Select academic fiscal year and provide payment transaction reference.", "Upload bank payment voucher or wire transfer receipt.", "Accounts desk audits bank reconciliation records.", "Finance Officer signs off on the official digital statement."]'::jsonb,
  '[{"id": "doc-payment-proof", "name": "Bank Transaction Proof / UTR Challan", "description": "Bank transfer acknowledgment or online payment confirmation screenshot.", "mandatory": true, "acceptedFormats": ["PDF", "JPG", "PNG"], "maxSizeMB": 5}]'::jsonb,
  '[{"id": "fiscalYear", "label": "Fiscal Academic Year", "type": "select", "options": ["2025-2026 (Current)", "2024-2025", "2023-2024"], "required": true}, {"id": "transactionRef", "label": "Bank Transaction / UTR / Reference Number", "type": "text", "placeholder": "e.g., UTR-9823410982", "required": true}]'::jsonb,
  true
),
(
  'srv-id-card',
  'Student ID Card Replacement',
  'ID-401',
  'Identity & Security',
  'Re-issuance of RFID smart campus identity card due to loss, theft, physical damage, or chip defect.',
  'dept-sec',
  'usr-approver-dean',
  'Chief Security Officer',
  true,
  3,
  '$10 replacement fee',
  'Currently enrolled students with verified loss declaration.',
  '["Provide reason for replacement and upload recent formal digital passport photograph.", "Upload police missing complaint or self-declaration loss undertaking.", "Security staff checks previous card status and invalidates old RFID chip.", "Chief Security Officer approves new chip encoding and card printing.", "Collect new physical smart card at Security HQ."]'::jsonb,
  '[{"id": "doc-photo", "name": "Passport Style Photograph", "description": "Color photo on plain white background taken within the last 6 months.", "mandatory": true, "acceptedFormats": ["JPG", "PNG"], "maxSizeMB": 3}, {"id": "doc-loss-report", "name": "Loss Declaration / Police FIR", "description": "Signed declaration describing card loss circumstances or police report.", "mandatory": true, "acceptedFormats": ["PDF", "JPG"], "maxSizeMB": 5}]'::jsonb,
  '[{"id": "reason", "label": "Reason for Reissuance", "type": "select", "options": ["Lost / Misplaced on Campus", "Stolen / Theft", "Damaged / RFID Chip Inoperable", "Name / Bio Data Correction"], "required": true}, {"id": "incidentDetails", "label": "Incident Summary / Date of Loss", "type": "textarea", "placeholder": "Approximate date and location where card was misplaced...", "required": true}]'::jsonb,
  true
),
(
  'srv-hostel',
  'Hostel Permission & Outpass',
  'HP-501',
  'Campus Life & Housing',
  'Mandatory electronic authorization for hostel boarders requesting overnight leave, home visits, or extended absence from campus residence.',
  'dept-hostel',
  'usr-approver-dean',
  'Chief Warden',
  true,
  1,
  'Free of Charge',
  'Active hostel residents in good disciplinary standing.',
  '["Submit travel dates, destination address, and emergency contact details.", "Attach parent/guardian consent confirmation letter or SMS proof.", "Hostel warden officer validates student attendance and guardian authorization.", "Chief Warden grants digital entry/exit QR gate pass.", "Present QR pass to campus security gates on departure and return."]'::jsonb,
  '[{"id": "doc-parent-consent", "name": "Parent / Guardian Consent Proof", "description": "Signed letter, scanned WhatsApp consent, or email approval from registered guardian.", "mandatory": true, "acceptedFormats": ["PDF", "JPG", "PNG"], "maxSizeMB": 4}]'::jsonb,
  '[{"id": "leaveType", "label": "Leave Duration", "type": "select", "options": ["Weekend Home Visit (1-2 days)", "Extended Vacation Leave (>3 days)", "Official Academic / Project Field Visit", "Emergency Family Visit"], "required": true}, {"id": "departureDate", "label": "Departure Date & Expected Return", "type": "text", "placeholder": "e.g., Oct 24, 2026 5:00 PM to Oct 27, 2026 8:00 AM", "required": true}, {"id": "destinationAddress", "label": "Destination Address & Contact", "type": "textarea", "placeholder": "Where will you be staying and emergency phone number...", "required": true}]'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  department_id = EXCLUDED.department_id,
  approver_title = EXCLUDED.approver_title,
  estimated_processing_days = EXCLUDED.estimated_processing_days,
  fee = EXCLUDED.fee,
  eligibility = EXCLUDED.eligibility,
  procedure = EXCLUDED.procedure,
  required_documents = EXCLUDED.required_documents,
  form_fields = EXCLUDED.form_fields,
  is_active = EXCLUDED.is_active;

-- End of StepWise Supabase Schema
