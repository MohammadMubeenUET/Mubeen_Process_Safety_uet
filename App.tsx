
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import BowtieEditor from './components/BowtieEditor';
import FaultTreeEditor from './components/FaultTreeEditor';
import EventTreeEditor from './components/EventTreeEditor';
import LOPAEditor from './components/LOPAEditor';
import QRAEditor from './components/QRAEditor';
import HazopEditor from './components/HazopEditor';
import FMEAEditor from './components/FMEAEditor';
import CaseStudiesPage from './components/CaseStudiesPage';

type PageType = 'landing' | 'editor' | 'eventtree' | 'faulttree' | 'lopa' | 'qra' | 'hazop' | 'fmea' | 'case-studies';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [caseStudyData, setCaseStudyData] = useState<any>(null);

  const navigateTo = (page: PageType) => {
    setCaseStudyData(null); // Clear previous case study data when navigating manually
    setCurrentPage(page);
  };

  const loadCaseStudy = (module: PageType, data: any) => {
    setCaseStudyData(data);
    setCurrentPage(module);
  };

  return (
    <div className="font-sans antialiased">
      {currentPage === 'landing' ? (
        <LandingPage onNavigate={navigateTo} />
      ) : currentPage === 'case-studies' ? (
        <CaseStudiesPage onBack={() => navigateTo('landing')} onSelectCase={loadCaseStudy} />
      ) : currentPage === 'editor' ? (
        <BowtieEditor onBack={() => navigateTo('landing')} initialData={caseStudyData} />
      ) : currentPage === 'eventtree' ? (
        <EventTreeEditor onBack={() => navigateTo('landing')} initialData={caseStudyData} />
      ) : currentPage === 'faulttree' ? (
        <FaultTreeEditor onBack={() => navigateTo('landing')} initialData={caseStudyData} />
      ) : currentPage === 'lopa' ? (
        <LOPAEditor onBack={() => navigateTo('landing')} initialData={caseStudyData} />
      ) : currentPage === 'qra' ? (
        <QRAEditor onBack={() => navigateTo('landing')} initialData={caseStudyData} />
      ) : currentPage === 'hazop' ? (
        <HazopEditor onBack={() => navigateTo('landing')} initialData={caseStudyData} />
      ) : currentPage === 'fmea' ? (
        <FMEAEditor onBack={() => navigateTo('landing')} initialData={caseStudyData} />
      ) : null}
    </div>
  );
}
