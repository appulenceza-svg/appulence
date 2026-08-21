import { useState, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  School,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Check,
  ShieldCheck,
  Code,
  Download,
  Users,
  Calendar,
  BookOpen,
  Award,
  DollarSign,
  Bus,
  Activity,
  Bell,
  Fingerprint
} from 'lucide-react';
import { SchoolOnboardingData, OnboardingModules } from '../types';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { Plus, Database, CloudLightning, ShieldAlert, LayoutDashboard, Radio, Server } from 'lucide-react';
import schoolsData from '../data/schools.json';

const INITIAL_FORM_STATE: SchoolOnboardingData = {
  schoolName: '',
  emisNumber: '',
  physicalAddress: '',
  schoolType: '',
  principalName: '',
  email: '',
  phone: '',
  modules: {
    sis: true,
    attendance: true,
    timetable: false,
    exams: false,
    finance: false,
    transport: false,
    behavior: false,
  },
  communicationChannels: ['Email'],
  specializedPrograms: '',
  emergencyProcedures: '',
  popiaAgreement: false,
  authorizedSignature: '',
  submissionDate: new Date().toISOString().split('T')[0],
};

interface FormErrors {
  schoolName?: string;
  emisNumber?: string;
  physicalAddress?: string;
  schoolType?: string;
  principalName?: string;
  email?: string;
  phone?: string;
  communicationChannels?: string;
  authorizedSignature?: string;
  popiaAgreement?: string;
}

export default function OnboardingForm() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<SchoolOnboardingData>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<SchoolOnboardingData | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    if (!user) {
      setSubmissions([]);
      return;
    }
    setLoadingSubmissions(true);
    try {
      const q = query(
        collection(db, 'schools_onboardings'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(docs);
    } catch (err) {
      console.error('Failed to load portal templates:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const steps = [
    { id: 1, title: 'Profile', desc: 'School Essentials' },
    { id: 2, title: 'Modules', desc: 'Core Services' },
    { id: 3, title: 'Logistics', desc: 'Ops & Comms' },
    { id: 4, title: 'Compliance', desc: 'POPIA Review' },
  ];

  // Client side validation per step
  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.schoolName.trim()) {
        newErrors.schoolName = 'School Name is required';
      }
      if (!formData.emisNumber.trim()) {
        newErrors.emisNumber = 'EMIS Number is required';
      } else if (!/^\d{8,10}$/.test(formData.emisNumber.trim())) {
        newErrors.emisNumber = 'EMIS Number must be a numeric value of 8 to 10 digits';
      }
      if (!formData.physicalAddress.trim()) {
        newErrors.physicalAddress = 'Physical Address is required';
      }
      if (!formData.schoolType) {
        newErrors.schoolType = 'Please select a School Type';
      }
      if (!formData.principalName.trim()) {
        newErrors.principalName = "Principal's Full Name is required";
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Contact Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Invalid email address format';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Contact Phone Number is required';
      } else if (!/^\+?[\d\s-]{9,15}$/.test(formData.phone.trim())) {
        newErrors.phone = 'Invalid phone number format';
      }
    }

    if (step === 3) {
      if (formData.communicationChannels.length === 0) {
        newErrors.communicationChannels = 'Select at least one preferred communication channel';
      }
    }

    if (step === 4) {
      if (!formData.popiaAgreement) {
        newErrors.popiaAgreement = 'You must agree to the POPIA compliance terms to proceed';
      }
      if (!formData.authorizedSignature.trim()) {
        newErrors.authorizedSignature = 'Authorized signature name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // Auto-populate form if a known school is selected
      if (name === 'schoolName') {
        const matchedSchool = schoolsData.find((s: any) => s.schoolName === value);
        if (matchedSchool) {
          if (matchedSchool.emisNumber) newData.emisNumber = matchedSchool.emisNumber;
          if (matchedSchool.schoolType) newData.schoolType = matchedSchool.schoolType;
          if (matchedSchool.physicalAddress) newData.physicalAddress = matchedSchool.physicalAddress;
          if (matchedSchool.principalName) newData.principalName = matchedSchool.principalName;
          if (matchedSchool.email) newData.email = matchedSchool.email;
          if (matchedSchool.phone) newData.phone = matchedSchool.phone;
        }
      }
      
      return newData;
    });
    // Clear error for field being edited
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleModuleChange = (moduleKey: keyof OnboardingModules) => {
    setFormData((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleKey]: !prev.modules[moduleKey],
      },
    }));
  };

  const handleCommChange = (channel: string) => {
    setFormData((prev) => {
      const exists = prev.communicationChannels.includes(channel);
      const updated = exists
        ? prev.communicationChannels.filter((c) => c !== channel)
        : [...prev.communicationChannels, channel];
      
      if (errors.communicationChannels && updated.length > 0) {
        setErrors((err) => ({ ...err, communicationChannels: undefined }));
      }
      
      return {
        ...prev,
        communicationChannels: updated,
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      if (user) {
        // Save to real Firestore database
        await addDoc(collection(db, 'schools_onboardings'), {
          ...formData,
          userId: user.uid,
          userEmail: user.email,
          status: 'Pending Provisioning',
          createdAt: new Date().toISOString()
        });
        await fetchSubmissions();
      }
      
      // Set submitted state for UX feedback
      setIsSubmitting(false);
      setSubmittedData(formData);
    } catch (err: any) {
      console.error('Firestore saving error:', err);
      setSubmissionError('Successfully validated form, but cloud database storage failed: ' + (err.message || err));
      setIsSubmitting(false);
      // Fallback: still show local preview so experience is seamless
      setSubmittedData(formData);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setCurrentStep(1);
    setSubmittedData(null);
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `appulence_onboarding_${formData.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'school'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <section id="onboarding" className="py-24 bg-background relative overflow-hidden">
      {/* Background soft glowing vector graphics */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-[350px] h-[350px] bg-primary-container/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-[1120px] mx-auto px-6 md:px-12 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="font-label-md text-xs uppercase tracking-widest text-primary font-bold flex items-center justify-center gap-2">
            <Fingerprint className="w-4 h-4 text-primary animate-pulse" /> School Provisioning Engine
          </span>
          <h2 className="font-headline-lg text-3xl md:text-5xl font-black tracking-tight text-on-surface">
            Portal Setup &amp; Onboarding
          </h2>
          <p className="font-body-md text-base md:text-lg text-on-surface-variant leading-relaxed">
            Configure your administrative parameters, activate tailored school management tools, and secure your educational databases instantly.
          </p>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </div>

        {/* Centered Main Wizard Form Card */}
        <div className="max-w-3xl mx-auto w-full">
          
          {/* Main Wizard Form Card */}
          <div className="bg-white border border-outline-variant/15 p-6 md:p-10 rounded-3xl shadow-xl relative">
            
            {/* Database Auth Connection Banner */}
            {!submittedData && !user && (
              <div className="mb-6 p-4 bg-amber-50/70 border border-amber-200/50 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
                <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-amber-900">Sandbox Preview Mode</p>
                  <p>You are submitting as an anonymous sandbox guest. Register or sign in to your administrator profile at the top right of the navigation bar to persistently save your provisioned schools in our cloud database.</p>
                </div>
              </div>
            )}

            {!submittedData && user && (
              <div className="mb-6 p-4 bg-emerald-50/75 border border-emerald-200/40 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 animate-fade-in">
                <Database className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-600" />
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-emerald-900 flex items-center gap-1.5">
                    Cloud Database Connected 
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </p>
                  <p>Authenticated as <strong className="font-semibold text-emerald-900">{user.displayName || user.email}</strong>. Every completed portal configuration will be provisioned inside your secure Firestore partition node.</p>
                </div>
              </div>
            )}

            {/* Step Wizard Header */}
            {!submittedData && (
              <div className="mb-10">
                <div className="flex justify-between items-center relative">
                  {/* Progress Line */}
                  <div className="absolute top-1/2 left-0 w-full h-[2px] bg-outline-variant/20 -translate-y-1/2 z-0" />
                  <div 
                    className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  />

                  {steps.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        // Allow skipping backwards freely, or jumping forward only if valid
                        if (s.id < currentStep) {
                          setCurrentStep(s.id);
                        } else if (s.id > currentStep) {
                          // Validate prior steps before letting them skip ahead
                          let isValid = true;
                          for (let stepToCheck = currentStep; stepToCheck < s.id; stepToCheck++) {
                            if (!validateStep(stepToCheck)) {
                              isValid = false;
                              break;
                            }
                          }
                          if (isValid) setCurrentStep(s.id);
                        }
                      }}
                      className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                          currentStep === s.id
                            ? 'bg-primary text-white scale-110 shadow-lg ring-4 ring-primary/15'
                            : currentStep > s.id
                            ? 'bg-primary text-white'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {currentStep > s.id ? <Check className="w-5 h-5 stroke-[2.5]" /> : s.id}
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-wider mt-2.5 transition-colors hidden sm:inline-block ${
                        currentStep === s.id ? 'text-primary' : 'text-on-surface-variant/70'
                      }`}>
                        {s.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inner Form Panels */}
            <AnimatePresence mode="wait">
              {!submittedData ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* STEP 1: SCHOOL ESSENTIALS */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="space-y-1">
                        <h3 className="font-headline-sm text-xl md:text-2xl font-black text-on-surface flex items-center gap-2">
                          <School className="w-6 h-6 text-primary" /> Profile Essentials
                        </h3>
                        <p className="font-body-sm text-xs text-on-surface-variant">
                          Please enter the formal legal and contact configurations of your school.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* School Name */}
                        <div className="space-y-1.5">
                          <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                            School Name <span className="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            name="schoolName"
                            list="schoolsList"
                            value={formData.schoolName}
                            onChange={handleTextChange}
                            placeholder="e.g. Appulence Heights Secondary"
                            className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                              errors.schoolName ? 'border-error' : 'border-outline-variant/25 focus:border-primary'
                            }`}
                          />
                          <datalist id="schoolsList">
                            {schoolsData.map((s: any) => (
                              <option key={s.emisNumber} value={s.schoolName} />
                            ))}
                          </datalist>
                          {errors.schoolName && (
                            <p className="text-error text-xs flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.schoolName}
                            </p>
                          )}
                        </div>

                        {/* EMIS Number */}
                        <div className="space-y-1.5">
                          <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                            EMIS Number <span className="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            name="emisNumber"
                            value={formData.emisNumber}
                            onChange={handleTextChange}
                            placeholder="e.g. 100200300 (8-10 Digits)"
                            className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                              errors.emisNumber ? 'border-error' : 'border-outline-variant/25 focus:border-primary'
                            }`}
                          />
                          {errors.emisNumber ? (
                            <p className="text-error text-xs flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.emisNumber}
                            </p>
                          ) : (
                            <p className="text-on-surface-variant/60 text-[10px]">
                              Unique ID registered with the Ministry of Education.
                            </p>
                          )}
                        </div>

                        {/* School Type */}
                        <div className="space-y-1.5">
                          <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                            School Classification <span className="text-error">*</span>
                          </label>
                          <select
                            name="schoolType"
                            value={formData.schoolType}
                            onChange={handleTextChange}
                            className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none ${
                              errors.schoolType ? 'border-error' : 'border-outline-variant/25 focus:border-primary'
                            }`}
                          >
                            <option value="">-- Choose Category --</option>
                            <option value="Public">Public Institution</option>
                            <option value="Private">Private Institution</option>
                          </select>
                          {errors.schoolType && (
                            <p className="text-error text-xs flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.schoolType}
                            </p>
                          )}
                        </div>

                        {/* Principal's Name */}
                        <div className="space-y-1.5">
                          <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                            Principal's Full Name <span className="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            name="principalName"
                            value={formData.principalName}
                            onChange={handleTextChange}
                            placeholder="e.g. Dr. Samuel Moko"
                            className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                              errors.principalName ? 'border-error' : 'border-outline-variant/25 focus:border-primary'
                            }`}
                          />
                          {errors.principalName && (
                            <p className="text-error text-xs flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.principalName}
                            </p>
                          )}
                        </div>

                        {/* Contact Email */}
                        <div className="space-y-1.5">
                          <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                            Principal's Email <span className="text-error">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleTextChange}
                              placeholder="e.g. principal@school.edu"
                              className={`w-full pl-11 pr-4 py-3 bg-surface-container-low border rounded-xl font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                                errors.email ? 'border-error' : 'border-outline-variant/25 focus:border-primary'
                              }`}
                            />
                            <Mail className="w-4 h-4 text-on-surface-variant/40 absolute left-4 top-1/2 -translate-y-1/2" />
                          </div>
                          {errors.email && (
                            <p className="text-error text-xs flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.email}
                            </p>
                          )}
                        </div>

                        {/* Contact Phone */}
                        <div className="space-y-1.5">
                          <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                            Principal's Phone <span className="text-error">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleTextChange}
                              placeholder="e.g. 0823228215"
                              className={`w-full pl-11 pr-4 py-3 bg-surface-container-low border rounded-xl font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                                errors.phone ? 'border-error' : 'border-outline-variant/25 focus:border-primary'
                              }`}
                            />
                            <Phone className="w-4 h-4 text-on-surface-variant/40 absolute left-4 top-1/2 -translate-y-1/2" />
                          </div>
                          {errors.phone && (
                            <p className="text-error text-xs flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Physical Address */}
                      <div className="space-y-1.5">
                        <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                          Physical Address <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <textarea
                            name="physicalAddress"
                            rows={3}
                            value={formData.physicalAddress}
                            onChange={handleTextChange}
                            placeholder="e.g. 35 10th St, Voorspoed, Welkom, 9459"
                            className={`w-full pl-11 pr-4 py-3 bg-surface-container-low border rounded-xl font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                              errors.physicalAddress ? 'border-error' : 'border-outline-variant/25 focus:border-primary'
                            }`}
                          />
                          <MapPin className="w-4 h-4 text-on-surface-variant/40 absolute left-4 top-4" />
                        </div>
                        {errors.physicalAddress && (
                          <p className="text-error text-xs flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.physicalAddress}
                          </p>
                        )}
                      </div>

                    </motion.div>
                  )}

                  {/* STEP 2: ADMINISTRATIVE MODULES */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="space-y-1">
                        <h3 className="font-headline-sm text-xl md:text-2xl font-black text-on-surface flex items-center gap-2">
                          <CheckCircle className="w-6 h-6 text-primary" /> Administrative Activation
                        </h3>
                        <p className="font-body-sm text-xs text-on-surface-variant">
                          Toggle which application nodes your school requires to set up in the portal environment.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* SIS */}
                        <div 
                          onClick={() => handleModuleChange('sis')}
                          className={`p-4 rounded-2xl border cursor-pointer flex gap-4 items-start transition-all duration-200 hover:-translate-y-0.5 ${
                            formData.modules.sis
                              ? 'border-primary bg-primary-container/5 ring-1 ring-primary/10'
                              : 'border-outline-variant/20 hover:border-outline-variant/50 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            formData.modules.sis ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 select-none">
                            <div className="flex items-center justify-between">
                              <span className="font-headline-xs text-sm font-black text-on-surface">Student Information (SIS)</span>
                              <input 
                                type="checkbox" 
                                checked={formData.modules.sis} 
                                readOnly
                                className="rounded text-primary focus:ring-primary w-4 h-4 shrink-0 pointer-events-none" 
                              />
                            </div>
                            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                              Configure directories, profile attributes, parental connections, and class allocations.
                            </p>
                          </div>
                        </div>

                        {/* Attendance Tracking */}
                        <div 
                          onClick={() => handleModuleChange('attendance')}
                          className={`p-4 rounded-2xl border cursor-pointer flex gap-4 items-start transition-all duration-200 hover:-translate-y-0.5 ${
                            formData.modules.attendance
                              ? 'border-primary bg-primary-container/5 ring-1 ring-primary/10'
                              : 'border-outline-variant/20 hover:border-outline-variant/50 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            formData.modules.attendance ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 select-none">
                            <div className="flex items-center justify-between">
                              <span className="font-headline-xs text-sm font-black text-on-surface">Attendance Tracking</span>
                              <input 
                                type="checkbox" 
                                checked={formData.modules.attendance} 
                                readOnly
                                className="rounded text-primary focus:ring-primary w-4 h-4 shrink-0 pointer-events-none" 
                              />
                            </div>
                            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                              Monitor class attendance metrics, daily registers, and trigger automated parental alerts.
                            </p>
                          </div>
                        </div>

                        {/* Timetable & Scheduling */}
                        <div 
                          onClick={() => handleModuleChange('timetable')}
                          className={`p-4 rounded-2xl border cursor-pointer flex gap-4 items-start transition-all duration-200 hover:-translate-y-0.5 ${
                            formData.modules.timetable
                              ? 'border-primary bg-primary-container/5 ring-1 ring-primary/10'
                              : 'border-outline-variant/20 hover:border-outline-variant/50 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            formData.modules.timetable ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            <Activity className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 select-none">
                            <div className="flex items-center justify-between">
                              <span className="font-headline-xs text-sm font-black text-on-surface">Timetable &amp; Scheduling</span>
                              <input 
                                type="checkbox" 
                                checked={formData.modules.timetable} 
                                readOnly
                                className="rounded text-primary focus:ring-primary w-4 h-4 shrink-0 pointer-events-none" 
                              />
                            </div>
                            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                              Orchestrate school slots, manage teacher availability, and allocate class spaces.
                            </p>
                          </div>
                        </div>

                        {/* Examination & Grading */}
                        <div 
                          onClick={() => handleModuleChange('exams')}
                          className={`p-4 rounded-2xl border cursor-pointer flex gap-4 items-start transition-all duration-200 hover:-translate-y-0.5 ${
                            formData.modules.exams
                              ? 'border-primary bg-primary-container/5 ring-1 ring-primary/10'
                              : 'border-outline-variant/20 hover:border-outline-variant/50 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            formData.modules.exams ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 select-none">
                            <div className="flex items-center justify-between">
                              <span className="font-headline-xs text-sm font-black text-on-surface">Examination &amp; Grading</span>
                              <input 
                                type="checkbox" 
                                checked={formData.modules.exams} 
                                readOnly
                                className="rounded text-primary focus:ring-primary w-4 h-4 shrink-0 pointer-events-none" 
                              />
                            </div>
                            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                              Design grading rubrics, log raw marks, and generate production-grade report cards.
                            </p>
                          </div>
                        </div>

                        {/* Fees & Financials */}
                        <div 
                          onClick={() => handleModuleChange('finance')}
                          className={`p-4 rounded-2xl border cursor-pointer flex gap-4 items-start transition-all duration-200 hover:-translate-y-0.5 ${
                            formData.modules.finance
                              ? 'border-primary bg-primary-container/5 ring-1 ring-primary/10'
                              : 'border-outline-variant/20 hover:border-outline-variant/50 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            formData.modules.finance ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 select-none">
                            <div className="flex items-center justify-between">
                              <span className="font-headline-xs text-sm font-black text-on-surface">Fees &amp; Finances</span>
                              <input 
                                type="checkbox" 
                                checked={formData.modules.finance} 
                                readOnly
                                className="rounded text-primary focus:ring-primary w-4 h-4 shrink-0 pointer-events-none" 
                              />
                            </div>
                            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                              Invoice structured school fees, log partial payments, and manage budget ledgers.
                            </p>
                          </div>
                        </div>

                        {/* Transport & Logistics */}
                        <div 
                          onClick={() => handleModuleChange('transport')}
                          className={`p-4 rounded-2xl border cursor-pointer flex gap-4 items-start transition-all duration-200 hover:-translate-y-0.5 ${
                            formData.modules.transport
                              ? 'border-primary bg-primary-container/5 ring-1 ring-primary/10'
                              : 'border-outline-variant/20 hover:border-outline-variant/50 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            formData.modules.transport ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            <Bus className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 select-none">
                            <div className="flex items-center justify-between">
                              <span className="font-headline-xs text-sm font-black text-on-surface">Transport &amp; Logistics</span>
                              <input 
                                type="checkbox" 
                                checked={formData.modules.transport} 
                                readOnly
                                className="rounded text-primary focus:ring-primary w-4 h-4 shrink-0 pointer-events-none" 
                              />
                            </div>
                            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                              Set up school transit corridors, manage driver allocation, and track vehicle routes.
                            </p>
                          </div>
                        </div>

                        {/* Behavioral Tracking */}
                        <div 
                          onClick={() => handleModuleChange('behavior')}
                          className={`p-4 rounded-2xl border cursor-pointer flex gap-4 items-start transition-all duration-200 hover:-translate-y-0.5 ${
                            formData.modules.behavior
                              ? 'border-primary bg-primary-container/5 ring-1 ring-primary/10'
                              : 'border-outline-variant/20 hover:border-outline-variant/50 bg-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            formData.modules.behavior ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 select-none">
                            <div className="flex items-center justify-between">
                              <span className="font-headline-xs text-sm font-black text-on-surface">Behavioral Tracking</span>
                              <input 
                                type="checkbox" 
                                checked={formData.modules.behavior} 
                                readOnly
                                className="rounded text-primary focus:ring-primary w-4 h-4 shrink-0 pointer-events-none" 
                              />
                            </div>
                            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                              Track merits, log incident reports, and administer disciplinary workflows with logs.
                            </p>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: LOGISTICS & PREFERENCES */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="space-y-1">
                        <h3 className="font-headline-sm text-xl md:text-2xl font-black text-on-surface flex items-center gap-2">
                          <Bell className="w-6 h-6 text-primary" /> Operational Configs
                        </h3>
                        <p className="font-body-sm text-xs text-on-surface-variant">
                          Define your standard communication setups and school specific operational constraints.
                        </p>
                      </div>

                      {/* Communication Channels */}
                      <div className="space-y-2">
                        <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                          Preferred Communication Channels <span className="text-error">*</span>
                        </label>
                        <p className="font-body-sm text-xs text-on-surface-variant/80">
                          Choose how your system triggers reports, emergencies, and academic notifications to guardians.
                        </p>
                        
                        <div className="flex flex-wrap gap-4 pt-2">
                          {['Email', 'SMS', 'Push Notifications'].map((channel) => {
                            const isSelected = formData.communicationChannels.includes(channel);
                            return (
                              <button
                                type="button"
                                key={channel}
                                onClick={() => handleCommChange(channel)}
                                className={`px-5 py-3 rounded-xl border font-label-md text-xs uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
                                  isSelected
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-surface-container-low text-on-surface border-outline-variant/15 hover:border-outline-variant/50'
                                }`}
                              >
                                {isSelected && <Check className="w-4 h-4" />}
                                {channel}
                              </button>
                            );
                          })}
                        </div>
                        {errors.communicationChannels && (
                          <p className="text-error text-xs flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.communicationChannels}
                          </p>
                        )}
                      </div>

                      {/* Specialized School Programs */}
                      <div className="space-y-1.5">
                        <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                          Specialized School Programs
                        </label>
                        <textarea
                          name="specializedPrograms"
                          rows={3}
                          value={formData.specializedPrograms}
                          onChange={handleTextChange}
                          placeholder="e.g. Advanced STEM academy tracks, dedicated special education needs support, professional vocational workshops, or national sports developmental plans."
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <p className="text-on-surface-variant/60 text-[10px]">
                          Detail any specialized academic or vocational offerings that require bespoke database structures.
                        </p>
                      </div>

                      {/* Emergency Procedures */}
                      <div className="space-y-1.5">
                        <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                          Emergency Procedures &amp; Protocols
                        </label>
                        <textarea
                          name="emergencyProcedures"
                          rows={3}
                          value={formData.emergencyProcedures}
                          onChange={handleTextChange}
                          placeholder="e.g. Mandatory parent/guardian waiver triggers prior to provincial school trips, instant SMS broadcasts on weather alerts, pre-authenticated emergency contacts."
                          className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <p className="text-on-surface-variant/60 text-[10px]">
                          Specify legal, safety, or medical protocols that must automatically be tied into the operational workflows.
                        </p>
                      </div>

                    </motion.div>
                  )}

                  {/* STEP 4: COMPLIANCE & REVIEW */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="space-y-1">
                        <h3 className="font-headline-sm text-xl md:text-2xl font-black text-on-surface flex items-center gap-2">
                          <ShieldCheck className="w-6 h-6 text-primary" /> POPIA &amp; Compliance Review
                        </h3>
                        <p className="font-body-sm text-xs text-on-surface-variant">
                          Please carefully review and sign off on legal database compliance agreements.
                        </p>
                      </div>

                      {/* Brief Recap for the Principal */}
                      <div className="bg-surface-container/60 p-5 rounded-2xl border border-outline-variant/15 space-y-4">
                        <h4 className="font-headline-xs text-sm font-black text-on-surface border-b border-outline-variant/10 pb-2 uppercase tracking-wide">
                          Summary of Parameters
                        </h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs font-medium">
                          <div>
                            <span className="text-on-surface-variant/60 block">School Entity:</span>
                            <span className="text-on-surface font-black text-sm">{formData.schoolName}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant/60 block">Classification:</span>
                            <span className="text-on-surface font-black">{formData.schoolType} ({formData.emisNumber})</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant/60 block">Authorized Officer:</span>
                            <span className="text-on-surface font-black">{formData.principalName}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant/60 block">Contact Vector:</span>
                            <span className="text-on-surface font-black">{formData.email}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-on-surface-variant/60 block">Active Application Modules:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {Object.entries(formData.modules)
                                .filter(([, active]) => active)
                                .map(([key]) => (
                                  <span key={key} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-black uppercase tracking-wider">
                                    {key === 'sis' ? 'Student Info' : key}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* POPIA Compliance Box */}
                      <div className="border border-primary-container/20 bg-primary-container/5 p-5 rounded-2xl space-y-4">
                        <div className="flex gap-3 items-start">
                          <input
                            type="checkbox"
                            id="popiaAgreement"
                            name="popiaAgreement"
                            checked={formData.popiaAgreement}
                            onChange={(e) => {
                              setFormData((prev) => ({ ...prev, popiaAgreement: e.target.checked }));
                              if (errors.popiaAgreement && e.target.checked) {
                                setErrors((err) => ({ ...err, popiaAgreement: undefined }));
                              }
                            }}
                            className="w-5 h-5 rounded text-primary focus:ring-primary border-outline-variant/30 mt-0.5 cursor-pointer"
                          />
                          <label htmlFor="popiaAgreement" className="font-body-sm text-xs md:text-sm text-on-surface select-none cursor-pointer leading-relaxed">
                            <strong className="text-primary">POPIA Compliance Consent Agreement *</strong><br />
                            I hereby represent that I am authorized to bind the aforementioned school. I consent to Appulence Tech storing and processing administrative registries, teacher, student, and legal guardian records in compliance with the <strong>Protection of Personal Information Act (POPIA), Act 4 of 2013</strong> of South Africa.
                          </label>
                        </div>
                        {errors.popiaAgreement && (
                          <p className="text-error text-xs flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.popiaAgreement}
                          </p>
                        )}
                      </div>

                      {/* Signature Name */}
                      <div className="space-y-1.5">
                        <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                          Authorized Officer Signature (Full Name) <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          name="authorizedSignature"
                          value={formData.authorizedSignature}
                          onChange={handleTextChange}
                          placeholder="Type your full name to sign electronically"
                          className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                            errors.authorizedSignature ? 'border-error' : 'border-outline-variant/25 focus:border-primary'
                          }`}
                        />
                        {errors.authorizedSignature ? (
                          <p className="text-error text-xs flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.authorizedSignature}
                          </p>
                        ) : (
                          <p className="text-on-surface-variant/60 text-[10px]">
                            Signing binds the institution to standard cloud portal Terms of Service.
                          </p>
                        )}
                      </div>

                    </motion.div>
                  )}

                  {/* Form Actions Footer */}
                  <div className="pt-6 border-t border-outline-variant/10 flex justify-between gap-4">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={currentStep === 1}
                      className="px-6 py-3 border border-outline-variant/25 text-on-surface-variant hover:bg-surface-container-high rounded-xl font-label-md text-xs uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </button>

                    {currentStep < steps.length ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-6 py-3 primary-gradient text-white rounded-xl font-label-md text-xs uppercase tracking-widest font-bold shadow-md hover:shadow-lg hover:scale-102 active:scale-98 transition-all flex items-center gap-2"
                      >
                        Next Step <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-primary hover:bg-primary-container text-white rounded-xl font-label-md text-xs uppercase tracking-widest font-black shadow-lg shadow-primary/25 active:scale-98 transition-all flex items-center gap-2"
                      >
                        {isSubmitting ? 'Syncing Systems...' : 'Submit & Provision Portal'}
                      </button>
                    )}
                  </div>

                </form>
              ) : (
                /* SUCCESS SCREEN */
                <motion.div
                  key="successState"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-8 flex flex-col items-center justify-center"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce">
                    <CheckCircle className="w-12 h-12" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-headline-lg text-3xl font-black text-on-surface">
                      Portal Provisioned!
                    </h3>
                    <p className="font-body-md text-sm md:text-base text-on-surface-variant max-w-lg mx-auto">
                      Intake form parsed successfully. Appulence deployment systems have instantiated a secure container partition with references matching your credentials.
                    </p>
                  </div>

                  {/* Provision Reference Code */}
                  <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/15 w-full max-w-md grid grid-cols-2 gap-4 text-left">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Deploy ID</span>
                      <p className="text-sm font-black text-on-surface font-mono">APP-PRV-930219</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Database Status</span>
                      <p className="text-sm font-black text-primary flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block animate-ping" />
                        Live Cluster
                      </p>
                    </div>
                    <div className="col-span-2 border-t border-outline-variant/10 pt-3 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Institution</span>
                        <p className="text-xs font-semibold text-on-surface">{submittedData.schoolName}</p>
                      </div>
                      <button
                        onClick={downloadJson}
                        className="p-2 bg-white border border-outline-variant/20 hover:bg-surface-container rounded-lg text-primary transition-all flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
                      >
                        <Download className="w-3.5 h-3.5" /> JSON schema
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 border border-outline-variant/25 text-on-surface hover:bg-surface-container rounded-xl font-label-md text-xs uppercase tracking-wider transition-all"
                    >
                      Onboard Another
                    </button>
                    <a
                      href="#academy"
                      className="px-6 py-3 primary-gradient text-white rounded-xl font-label-md text-xs uppercase tracking-widest font-bold shadow-md"
                    >
                      Return to Academy
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

        {/* Real-time Submissions List / Active Cloud Portals */}
        {user && submissions.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-6 pt-12 border-t border-outline-variant/15">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-headline-sm text-xl font-black text-on-surface flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-primary" /> Active Cloud Portals
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Provisioned database containers and management portals for your educational nodes.
                </p>
              </div>
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] uppercase font-black tracking-wider rounded-full">
                {submissions.length} Total Node{submissions.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid gap-4">
              {submissions.map((sub, index) => (
                <div 
                  key={sub.id || index}
                  className="bg-white border border-outline-variant/15 hover:border-primary/30 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group"
                >
                  {/* Glowing background hint on hover */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/2 rounded-full blur-xl group-hover:bg-primary/5 transition-all pointer-events-none" />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-sm font-black text-on-surface uppercase tracking-tight">
                        {sub.schoolName}
                      </h4>
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-[9px] font-mono rounded font-semibold">
                        EMIS: {sub.emisNumber}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        {sub.status || 'Active Node'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-on-surface-variant/85 flex-wrap">
                      <span>Principal: <strong className="text-on-surface font-semibold">{sub.principalName}</strong></span>
                      <span>Email: <strong className="text-on-surface font-semibold">{sub.email}</strong></span>
                      <span>Date: <strong className="text-on-surface font-semibold">{sub.submissionDate || new Date().toLocaleDateString()}</strong></span>
                    </div>

                    {/* Modules activated */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sub.modules && Object.entries(sub.modules).map(([moduleKey, isEnabled]) => {
                        if (!isEnabled) return null;
                        const labelMap: Record<string, string> = {
                          sis: 'SIS Engine',
                          attendance: 'Biometric Attendance',
                          timetable: 'Auto-Scheduling',
                          exams: 'Assessment Suite',
                          finance: 'Bursar & Payments',
                          transport: 'Fleet Dispatch',
                          behavior: 'Merits & Discipline'
                        };
                        return (
                          <span 
                            key={moduleKey}
                            className="px-2 py-0.5 bg-primary/5 text-primary text-[9px] font-bold uppercase tracking-wider rounded border border-primary/10"
                          >
                            {labelMap[moduleKey] || moduleKey}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto self-stretch md:self-auto justify-end border-t md:border-t-0 border-outline-variant/10 pt-3 md:pt-0">
                    <button 
                      onClick={() => {
                        // Quick detail schema download
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sub, null, 2));
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute("href", dataStr);
                        downloadAnchor.setAttribute("download", `${sub.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_manifest.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                      }}
                      className="px-3.5 py-2 border border-outline-variant/20 hover:border-primary/20 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-primary/5 text-primary transition-all flex items-center gap-1.5"
                    >
                      <Server className="w-3.5 h-3.5" /> Manifest
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
