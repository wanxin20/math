
import React, { useState } from 'react';
import { COMPETITIONS, TEMPLATES } from '../constants';
import { User, UserRegistration, RegistrationStatus } from '../types';
import { Language, translations } from '../i18n';

interface DashboardProps {
  user: User;
  registrations: UserRegistration[];
  onPay: (compId: string) => void;
  onSubmit: (compId: string, fileName: string) => void;
  lang: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ user, registrations, onPay, onSubmit, lang }) => {
  const t = translations[lang].dashboard;
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  const userCompetitions = registrations.map(reg => {
    const info = COMPETITIONS.find(c => c.id === reg.competitionId);
    return { ...reg, info };
  }).filter(item => item.info);

  const getStatusText = (status: RegistrationStatus) => {
    switch(status) {
      case RegistrationStatus.PENDING_PAYMENT: return t.status.pending;
      case RegistrationStatus.PAID: return t.status.paid;
      case RegistrationStatus.SUBMITTED: return t.status.submitted;
      default: return '...';
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t.welcome}, {user.name}</h1>
          <p className="text-gray-500">{t.sub}</p>
        </div>
        <div className="flex gap-4 bg-gray-50 p-1 rounded-xl">
           <button onClick={() => setActiveTab('all')} className={`px-6 py-2 rounded-lg text-sm font-semibold ${activeTab === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>{t.all}</button>
           <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-lg text-sm font-semibold ${activeTab === 'pending' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>{t.pending}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {userCompetitions.map(reg => (
            <div key={reg.competitionId} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">{lang === 'zh' ? reg.info?.title : reg.competitionId.toUpperCase()}</h3>
                <span className="text-xs font-bold px-2 py-1 rounded bg-blue-50 text-blue-600">{getStatusText(reg.status)}</span>
              </div>
              
              <div className="flex justify-between gap-2 mb-8">
                 <div className="text-center flex-1">
                   <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-1"><i className="fas fa-check text-[10px]"></i></div>
                   <div className="text-[10px]">{t.steps.reg}</div>
                 </div>
                 <div className="text-center flex-1">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${reg.status !== RegistrationStatus.PENDING_PAYMENT ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}><i className="fas fa-credit-card text-[10px]"></i></div>
                   <div className="text-[10px]">{t.steps.pay}</div>
                 </div>
                 <div className="text-center flex-1">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${reg.status === RegistrationStatus.SUBMITTED ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}><i className="fas fa-upload text-[10px]"></i></div>
                   <div className="text-[10px]">{t.steps.submit}</div>
                 </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                 {reg.status === RegistrationStatus.PENDING_PAYMENT && (
                   <button onClick={() => onPay(reg.competitionId)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold w-full">{t.actions.payNow}</button>
                 )}
                 {reg.status === RegistrationStatus.PAID && (
                   <label className="cursor-pointer bg-white border border-blue-200 text-blue-600 px-6 py-2 rounded-lg text-sm font-bold w-full text-center">
                     <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onSubmit(reg.competitionId, e.target.files[0].name)} />
                     {t.actions.upload}
                   </label>
                 )}
                 {reg.status === RegistrationStatus.SUBMITTED && (
                   <div className="text-green-600 font-bold text-sm text-center w-full">{t.actions.done}: {reg.submissionFile}</div>
                 )}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
             <h4 className="font-bold mb-4">{t.resources}</h4>
             <div className="space-y-2">
               {TEMPLATES.map((tmpl, i) => (
                 <div key={i} className="text-xs p-2 hover:bg-gray-50 rounded cursor-pointer border-b last:border-0">{tmpl.name}</div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
