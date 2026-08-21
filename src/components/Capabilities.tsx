import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CapabilityItem } from '../types';

const capabilitiesList: CapabilityItem[] = [
  {
    category: 'Consulting',
    title: 'Business Analysis',
    description: 'Aligning architectural roadmaps, workflows, and core constraints for enterprise solutions.',
    imageAlt: 'Business analysis workflow visualization',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMmr6KOBRqGQ4vci-8GFK1md7m7jUh7_r2SRt6elm_YBVy5HRe23nSaD8d18MDC0tbRDqJSJWJiOUOGeH7H7YiJ-EKcXEAbGi16rt6Z_Ut7KJ7JP_9hdIsw5yUv8ENb0bNZf2PGYKaDGAHUe3LZPM-MS-4rTE78vzM3ERqDwRJ0LNyURNmng7sl1iy6ta0AgxS2bItGspUW4fHL2s4jEh00KKMxTHhbr5mQQtsC3HGEnXxCENdeS_IzvD9AVdRtsT7_pphRxe8fd8',
  },
  {
    category: 'Consulting',
    title: 'PMO Strategy',
    description: 'Elite governance structures, risk mitigations, and velocity optimization protocols.',
    imageAlt: 'Project Management Office dashboard interface',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXMuBJMr_8_rSUkKHrJGLUaqNp2HPwhOIxHHra1ufqBHKoE3sC36AekatmFQThshHOuuMzKmTF4v3NDCAOF7EnyBQ8tR6yLlRwq_-0JJKOuSuCEyI5ZUxRr1oWT_WlKQsJKNB9I-84Q-gNu3AIV_EHupTTSFS2pfu6yZ7w3YOnlnRVosU_Xo4G-s0QcZrwYWsFlrtuJDr7YpTp75ZQlXS6j_OCKIh6HVIywOh34teR2jdRrHfTmf89HAIb6EdU-n4QdEykqj_X4Sk',
  },
  {
    category: 'Innovation',
    title: 'Software Engineering',
    description: 'Enterprise software crafted with pristine quality, strict testing, and modern performance baselines.',
    imageAlt: 'High performance backend code editor',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7grn-_EQhA96wMpCWOPA4CZs7cXw2vSpe_DBWAhiStXa_08wHDt1zSg_LDmm3tP_R8ynTxy4HhYzIlxhqk5WsQE2tGOte93rFT_eKlk5aqqA_cB2_9zCEH8S6xjl7W-rLdAaDPt-TxnV8tCh0wltrWIju6BI2s_qGmi_ruKw1fFpm-AimPopZ5jJwNmvWIydBn8O927haNEMqXxuVxS4__MZODHtBZ6i4f_AvJA0TjY91qPZs6xux-t-8SgGSi8Uv98AiYVVn9Wg',
  },
  {
    category: 'Innovation',
    title: 'Web Apps',
    description: 'Stunning, production-grade applications running with optimal UI layout, security, and responsive touch mechanics.',
    imageAlt: 'Dynamic web dashboard mockup',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHXTs7JMm0N319qM0kmeguBCrNLOPJRz09IA9ohfb3x1EghgMC2IUes8dkA6tOBPtKsbEfT5g5mVyYiTj0jD8SCiiebKIDlQSXsJc2RzZDVQVQdfjLPCZ1Fxk-VRy1VH4Ht-nZjD15Vc36_10_QbCl0X5ksyS9lCyLtcnQ2X4pFo49sGTAqIAs8KPOLyV0GTlx8JyfPOnO66imrrkduVKNpaVm_gSJFZAnCLebMtW5C7LKgy_wWhFAIO_VtJKggN1BIt0VbViOyMc',
  },
  {
    category: 'Telecoms',
    title: 'Telecoms Operations',
    description: 'Optimizing networks, OSS/BSS integrations, automated provisioning, and next-generation routing matrices.',
    imageAlt: 'Telecom core routing physical nodes',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaEcZeRX0ZTIfiHjDwvtaqiAm4eITpZPS9ReoGondTMw_gHlXSdcM_2GpBEkZwCOTU2LxBtMBn1I9z-td776pCPcnq9GXiqXFKuN7yvZurZCmZY08rup62jFdana2AS8RhdyBxfGWP5uhZic3HK-5BRccOe3S9m7IUUHEvMSAUOv3CXsb0KzjKEToM97Q4ernahngQqqc9sCsYxQIeD-6YNpGolPea6RG0KweQkwLYmII2lW2jZjc-saRCi18ZOvF_w9oiPftuGjU',
  },
  {
    category: 'Telecoms',
    title: 'Cloud Ecosystems',
    description: 'Deploying resilient multi-cloud strategies, Kubernetes orchestrations, and secure backend microservices.',
    imageAlt: 'Multi-cloud kubernetes panel diagram',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSfWeoKZX8BZgJIbQnSw-18Uvwuvir0FBLcVQc71_mIjqR9NNXuXIK0iinUXYTPr-4DwrjHXs7C1CT1XICASWqMo5dbCPf6VCasr8UEYklSekmJa5llZeP2qtKBv5eJ1f4DMsW5aS25WM4EOmGiuntkeQB-ZxhGb5r3AOAg7klFK_-EiCis_m3PFp_W-2JDP1YKFf6i9mPRU0h7pMQGggu1PRon0Zeoy7zKYLMuYqLUjPJjNIih4hwmLjDmqDXQiUMgXmD-7f4aPo',
  },
];

type TabType = 'All' | 'Consulting' | 'Innovation' | 'Telecoms';

export default function Capabilities() {
  const [activeTab, setActiveTab] = useState<TabType>('All');

  const filteredItems = capabilitiesList.filter(
    (item) => activeTab === 'All' || item.category === activeTab
  );

  return (
    <section id="capabilities" className="py-24 bg-white relative">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 space-y-12">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="font-label-md text-xs uppercase tracking-widest text-primary font-bold">
            Core Capabilities
          </span>
          <h2 className="font-headline-lg text-3xl md:text-5xl font-black tracking-tight text-on-surface">
            Mastering the Full Stack of Innovation
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 p-1.5 bg-surface-container/50 max-w-xl mx-auto rounded-2xl border border-outline-variant/10">
          {(['All', 'Consulting', 'Innovation', 'Telecoms'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-2.5 rounded-xl font-label-md text-xs md:text-sm font-semibold tracking-wider transition-all duration-300 ${
                activeTab === tab
                  ? 'text-white shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40'
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 primary-gradient rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              {tab}
            </button>
          ))}
        </div>

        {/* Dynamic Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                layout
                key={item.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="group flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 hover:shadow-xl transition-all duration-300"
              >
                {/* Image Container */}
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-primary font-label-md text-xs uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg border border-outline-variant/10 shadow-sm">
                    {item.category}
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-headline-sm text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="font-body-sm text-sm text-on-surface-variant leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <a
                    href="#academy"
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary-container font-label-md text-xs font-bold uppercase tracking-wider group/link self-start"
                  >
                    Partner on this Project{' '}
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
