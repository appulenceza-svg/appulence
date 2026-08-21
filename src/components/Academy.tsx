import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Mail, BookOpen, CheckCircle, Award } from 'lucide-react';
import { SchoolNomination } from '../types';

export default function Academy() {
  const [formData, setFormData] = useState<SchoolNomination>({
    schoolName: '',
    email: '',
    primaryNeed: 'Student Information System',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.schoolName || !formData.email) return;

    setIsSubmitting(true);
    
    // Simulate API registration
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  const handleReset = () => {
    setFormData({
      schoolName: '',
      email: '',
      primaryNeed: 'Student Information System',
    });
    setIsSuccess(false);
  };

  return (
    <section id="academy" className="py-24 bg-white relative">
      <div className="absolute top-0 left-0 w-[350px] h-[350px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Side: Program Details */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-4">
            <span className="font-label-md text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-2">
              <Award className="w-4 h-4" /> Academy Initiative
            </span>
            <h2 className="font-headline-lg text-3xl md:text-5xl font-black tracking-tight text-on-surface">
              100 Free Apps for 100 Schools
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full" />
          </div>

          <p className="font-body-md text-base md:text-lg text-on-surface-variant leading-relaxed">
            Appulence Tech has pledged to build and host 100 custom web applications for 100 schools across Africa for free. Nominate a school below to give them access to high-performance, tailored educational platforms.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary shrink-0 mt-1">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-headline-xs text-base font-bold text-on-surface">
                  Who can qualify?
                </h4>
                <p className="font-body-sm text-sm text-on-surface-variant leading-relaxed">
                  Underfunded public schools, community centers, and educational foundations.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary shrink-0 mt-1">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-headline-xs text-base font-bold text-on-surface">
                  What templates do we build?
                </h4>
                <p className="font-body-sm text-sm text-on-surface-variant leading-relaxed">
                  Student management systems, homework portals, library databases, and offline educational hubs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Nomination Form */}
        <div className="lg:col-span-6">
          <div className="bg-surface-container-low border border-outline-variant/15 p-8 md:p-10 rounded-2xl shadow-xl relative overflow-hidden">
            
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h3 className="font-headline-md text-xl md:text-2xl font-black text-on-surface">
                      Nominate a School
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant">
                      Enter details below. Submissions are processed by our CSR board within 72 hours.
                    </p>
                  </div>

                  {/* School Name input */}
                  <div className="space-y-1.5">
                    <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                      School Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.schoolName}
                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                        placeholder="e.g. Hope Community High School"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant/20 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
                      />
                      <School className="w-4 h-4 text-on-surface-variant/40 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Email input */}
                  <div className="space-y-1.5">
                    <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                      Your Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. principal@school.org"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant/20 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
                      />
                      <Mail className="w-4 h-4 text-on-surface-variant/40 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Primary Educational Need dropdown */}
                  <div className="space-y-1.5">
                    <label className="font-label-md text-xs uppercase tracking-wider text-on-surface font-bold">
                      Primary Application Type
                    </label>
                    <select
                      value={formData.primaryNeed}
                      onChange={(e) => setFormData({ ...formData, primaryNeed: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-outline-variant/20 rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm appearance-none"
                    >
                      <option value="Student Information System">Student Information System</option>
                      <option value="E-Learning Portal">E-Learning &amp; Assignment Portal</option>
                      <option value="Library Management Hub">Library Management Hub</option>
                      <option value="Custom Community Website">Custom Community Website</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full primary-gradient text-white py-4 rounded-xl font-label-md text-xs uppercase tracking-widest font-black shadow-lg shadow-primary/25 hover:shadow-xl active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Registering Nomination...' : 'Submit Nomination'}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-8 space-y-6 flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-headline-md text-2xl font-black text-on-surface">
                      Nomination Saved!
                    </h3>
                    <p className="font-body-md text-sm text-on-surface-variant max-w-sm">
                      Thank you for your submission. An integration specialist will reach out to <strong>{formData.email}</strong> to begin the architecture alignment for <strong>{formData.schoolName}</strong>.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-outline-variant/15 w-full flex justify-between items-center text-left">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Nominee</span>
                      <p className="text-sm font-black text-on-surface">{formData.schoolName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Queue Position</span>
                      <p className="text-sm font-black text-primary text-right">#84 / 100</p>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="text-primary hover:text-primary-container font-label-md text-xs font-bold uppercase tracking-wider pt-2"
                  >
                    Nominate Another School
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>
    </section>
  );
}
