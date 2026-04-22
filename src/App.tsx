import { 
  Search, 
  ChevronRight, 
  Plus, 
  User,
  MoreVertical,
  ChevronLeft,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/src/lib/utils';

// --- Types ---

type ResearchType = 'интервью' | 'ux-test';

interface Research {
  id: string;
  title: string;
  type: ResearchType;
  primaryInterviewer: string; // @nickname
  additionalInterviewers?: string[]; // @nicknames
  requestDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reward: string;
}

type CallStatus = 'В очереди на прозвон' | 'В работе оператора' | 'Согласились' | 'Отказались' | 'Отменен' | 'Задача просрочена';
type PaymentStatus = 'Оплачено' | 'Не оплачено' | 'Нет статуса прихода' | 'Согласились';

interface Respondent {
  id: string;
  fullName: string;
  siebelId: string;
  researchId: string;
  callStatus: CallStatus;
  paymentStatus: PaymentStatus;
  meetingTime?: string; // HH:mm
  meetingDate?: string; // YYYY-MM-DD
}

// --- Mock Data ---

const CURRENT_USER = '@dana.p';
const TODAY = '2026-04-22';

const MOCK_RESEARCHES: Research[] = [
  {
    id: 'RES-001',
    title: 'Авто-ассистент ЦУ: Исследование фидбека',
    type: 'интервью',
    primaryInterviewer: '@dana.p',
    additionalInterviewers: ['@konst.b'],
    requestDate: '2026-04-01',
    startDate: '2026-04-10',
    endDate: '2026-04-20',
    reward: '1000 рублей'
  },
  {
    id: 'RES-002',
    title: 'Мнение по поводу креативов в приложении (КК)',
    type: 'ux-test',
    primaryInterviewer: '@arman.o',
    additionalInterviewers: ['@dana.p'],
    requestDate: '2026-03-25',
    startDate: '2026-04-05',
    endDate: '2026-04-22',
    reward: '1500 рублей'
  },
  {
    id: 'RES-003',
    title: 'UX-тестирование "Кубышки" в мобильном банке',
    type: 'ux-test',
    primaryInterviewer: '@elen.s',
    additionalInterviewers: ['@tatyana.k'],
    requestDate: '2026-03-15',
    startDate: '2026-03-27',
    endDate: '2026-03-30',
    reward: '1500 рублей'
  },
  {
    id: 'RES-004',
    title: 'Переводы по номеру телефона: барьеры',
    type: 'интервью',
    primaryInterviewer: '@dana.p',
    requestDate: '2026-04-15',
    startDate: '2026-04-22',
    endDate: '2026-04-30',
    reward: '2000 рублей'
  },
  {
    id: 'RES-005',
    title: 'Лояльность клиентов малого бизнеса',
    type: 'интервью',
    primaryInterviewer: '@ivan.i',
    additionalInterviewers: ['@sergey.v', '@dana.p'],
    requestDate: '2026-04-10',
    startDate: '2026-04-20',
    endDate: '2026-05-01',
    reward: '2500 рублей'
  },
  {
    id: 'RES-006',
    title: 'Старое исследование (архив)',
    type: 'ux-test',
    primaryInterviewer: '@dana.p',
    requestDate: '2026-01-01',
    startDate: '2026-01-05',
    endDate: '2026-01-10',
    reward: '1000 рублей'
  }
];

const MOCK_RESPONDENTS: Respondent[] = [
  ...Array.from({ length: 45 }).map((_, i) => ({
    id: `RESP-${1000 + i}`,
    fullName: [
      'Иванов Иван', 'Петров Петр', 'Сидоров Сидор', 'Смирнова Анна', 'Кузнецова Мария', 
      'Попов Алексей', 'Васильев Василий', 'Соколов Дмитрий', 'Михайлов Михаил', 'Новиков Артем'
    ][i % 10] + ' ' + ['Иванович', 'Петрович', 'Сидорович', 'Сергеевна', 'Дмитриевна'][i % 5],
    siebelId: `S-${800000 + i}`,
    researchId: 'RES-001',
    callStatus: (['В очереди на прозвон', 'В работе оператора', 'Согласились', 'Отказались', 'Отменен', 'Задача просрочена'] as CallStatus[])[i % 6],
    paymentStatus: (['Оплачено', 'Не оплачено', 'Нет статуса прихода', 'Согласились'] as PaymentStatus[])[i % 4],
    meetingDate: i % 3 === 0 ? '2026-04-15' : undefined,
    meetingTime: i % 3 === 0 ? '14:00' : undefined,
  })),
  ...Array.from({ length: 20 }).map((_, i) => ({
    id: `RESP-${2000 + i}`,
    fullName: `Тестовый Респондент ${i + 1}`,
    siebelId: `S-${900000 + i}`,
    researchId: 'RES-002',
    callStatus: 'Согласились' as CallStatus,
    paymentStatus: 'Оплачено' as PaymentStatus,
    meetingDate: '2026-04-20',
    meetingTime: '10:00',
  }))
];

// --- Components ---

const StatusPill = ({ status, type }: { status: CallStatus | PaymentStatus | ResearchType, type?: 'call' | 'payment' | 'type' }) => {
  const getStyles = () => {
    if (type === 'type') {
      return status === 'интервью' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-purple-50 text-purple-600 border-purple-100';
    }
    
    const colors: Record<string, string> = {
      'В очереди на прозвон': 'bg-orange-50 text-orange-600 border-orange-100',
      'В работе оператора': 'bg-blue-50 text-blue-600 border-blue-100',
      'Согласились': 'bg-green-50 text-green-600 border-green-100',
      'Отказались': 'bg-red-50 text-red-600 border-red-100',
      'Отменен': 'bg-gray-100 text-gray-500 border-gray-200',
      'Задача просрочена': 'bg-slate-100 text-slate-600 border-slate-300',
      'Оплачено': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'Не оплачено': 'bg-red-50 text-red-600 border-red-100',
      'Нет статуса прихода': 'bg-gray-50 text-gray-400 border-gray-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-500 border-gray-200';
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-sm text-sm font-medium border whitespace-nowrap", getStyles())}>
      {status}
    </span>
  );
};

const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] bg-white p-10 rounded-sm border border-gray-200 shadow-sm text-center"
      >
        <div className="w-16 h-16 bg-[#FFD700] rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ResearchHub</h1>
        <p className="text-gray-500 text-sm mb-8">
          Внутренняя система управления корпоративными исследованиями и респондентами
        </p>
        <button 
          onClick={onLogin}
          className="w-full h-12 bg-[#FFD700] hover:bg-[#E6C200] text-black font-semibold rounded-sm transition-colors flex items-center justify-center gap-2"
        >
          Войти через SSO
        </button>
        <div className="mt-8 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">
            Только для сотрудников
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'list' | 'details'>('list');
  const [selectedResearch, setSelectedResearch] = useState<Research | null>(null);

  // Filters State
  const [searchTitle, setSearchTitle] = useState('');
  const [filterInterviewer, setFilterInterviewer] = useState('');
  const [filterType, setFilterType] = useState<ResearchType | 'все'>('все');
  const [filterRequestDate, setFilterRequestDate] = useState('');
  const [filterPeriodStart, setFilterPeriodStart] = useState('');
  const [filterPeriodEnd, setFilterPeriodEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Respondent filters in Details
  const [respondentSearch, setRespondentSearch] = useState('');
  const [respondentPaymentFilter, setRespondentPaymentFilter] = useState<PaymentStatus | 'все'>('все');

  const isRecent = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date(TODAY);
    const diffDays = Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 14;
  };

  const filteredResearches = useMemo(() => {
    return MOCK_RESEARCHES
      .filter(res => {
        const isMyStudy = res.primaryInterviewer === CURRENT_USER || res.additionalInterviewers?.includes(CURRENT_USER);
        if (!isMyStudy) return false;

        if (!isRecent(res.endDate)) return false;

        if (searchTitle && !res.title.toLowerCase().includes(searchTitle.toLowerCase())) return false;

        if (filterInterviewer && !res.primaryInterviewer.includes(filterInterviewer) && !res.additionalInterviewers?.some(i => i.includes(filterInterviewer))) return false;

        if (filterType !== 'все' && res.type !== filterType) return false;

        if (filterRequestDate && res.requestDate !== filterRequestDate) return false;

        if (filterPeriodStart || filterPeriodEnd) {
          const start = filterPeriodStart ? new Date(filterPeriodStart) : new Date('0001-01-01');
          const end = filterPeriodEnd ? new Date(filterPeriodEnd) : new Date('9999-12-31');
          
          const resReq = new Date(res.requestDate);
          const resStart = new Date(res.startDate);
          const resEnd = new Date(res.endDate);

          const matches = (resReq >= start && resReq <= end) ||
                          (resStart >= start && resStart <= end) ||
                          (resEnd >= start && resEnd <= end) ||
                          (resStart <= start && resEnd >= end);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }, [searchTitle, filterInterviewer, filterType, filterRequestDate, filterPeriodStart, filterPeriodEnd]);

  const paginatedResearches = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredResearches.slice(start, start + itemsPerPage);
  }, [filteredResearches, currentPage]);

  const respondentStats = useMemo(() => {
    if (!selectedResearch) return [];
    const respondents = MOCK_RESPONDENTS.filter(r => r.researchId === selectedResearch.id);
    const counts: Record<CallStatus, number> = {
      'В очереди на прозвон': 0,
      'В работе оператора': 0,
      'Согласились': 0,
      'Отказались': 0,
      'Отменен': 0,
      'Задача просрочена': 0
    };
    respondents.forEach(r => counts[r.callStatus]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [selectedResearch]);

  const paymentSummary = useMemo(() => {
    if (!selectedResearch) return [];
    const respondents = MOCK_RESPONDENTS.filter(r => r.researchId === selectedResearch.id);
    const summary = {
      'Согласились': respondents.filter(r => r.callStatus === 'Согласились').length,
      'Нет статуса прихода': respondents.filter(r => r.paymentStatus === 'Нет статуса прихода').length,
      'Оплачено': respondents.filter(r => r.paymentStatus === 'Оплачено').length,
      'Не оплачено': respondents.filter(r => r.paymentStatus === 'Не оплачено').length,
    };
    return Object.entries(summary);
  }, [selectedResearch]);

  const currentRespondents = useMemo(() => {
    if (!selectedResearch) return [];
    return MOCK_RESPONDENTS.filter(r => {
      if (r.researchId !== selectedResearch.id) return false;
      
      const searchLower = respondentSearch.toLowerCase();
      const matchesSearch = !respondentSearch || 
        r.fullName.toLowerCase().includes(searchLower) || 
        r.siebelId.toLowerCase().includes(searchLower);
        
      const matchesPayment = respondentPaymentFilter === 'все' || r.paymentStatus === respondentPaymentFilter;
      
      return matchesSearch && matchesPayment;
    });
  }, [selectedResearch, respondentSearch, respondentPaymentFilter]);

  if (!isAuthenticated) {
    return <AuthScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F6F6F6] text-[#1A1A1A] font-sans flex flex-col">
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 px-8 flex items-center shrink-0">
          <div className="flex items-center gap-2">
            {currentScreen === 'details' && (
              <button 
                onClick={() => setCurrentScreen('list')}
                className="p-1 hover:bg-gray-100 rounded-sm mr-2"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <h2 className="text-sm font-bold uppercase tracking-widest">
              {currentScreen === 'list' ? 'Мои исследования' : 'Детали исследования'}
            </h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#F6F6F6] p-8">
          <AnimatePresence mode="wait">
            {currentScreen === 'list' ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-white p-5 border border-gray-200 rounded-sm shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-400 uppercase">Название</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input 
                          type="text" 
                          placeholder="Поиск по названию..."
                          className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                          value={searchTitle}
                          onChange={(e) => setSearchTitle(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-400 uppercase">Интервьюер</label>
                      <input 
                        type="text" 
                        placeholder="@nickname"
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                        value={filterInterviewer}
                        onChange={(e) => setFilterInterviewer(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-400 uppercase">Тип</label>
                      <select 
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                      >
                        <option value="все">Все типы</option>
                        <option value="интервью">интервью</option>
                        <option value="ux-test">ux-test</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-400 uppercase">Дата заявки</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                        value={filterRequestDate}
                        onChange={(e) => setFilterRequestDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-50 flex flex-wrap items-end gap-4">
                    <div className="space-y-1 min-w-[240px]">
                      <label className="text-sm font-bold text-gray-400 uppercase">Дата начала и конца исследования</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="date" 
                          className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-sm"
                          value={filterPeriodStart}
                          onChange={(e) => setFilterPeriodStart(e.target.value)}
                        />
                        <span className="text-gray-300">→</span>
                        <input 
                          type="date" 
                          className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-sm"
                          value={filterPeriodEnd}
                          onChange={(e) => setFilterPeriodEnd(e.target.value)}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const thirtyDaysAgo = new Date(TODAY);
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        setFilterPeriodStart(thirtyDaysAgo.toISOString().split('T')[0]);
                        setFilterPeriodEnd(TODAY);
                      }}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-sm text-sm border border-gray-200"
                    >
                      Последние 30 дней
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-200">
                        <th className="px-6 py-3 text-sm font-bold text-gray-400 uppercase tracking-wider">Название исследования</th>
                        <th className="px-4 py-3 text-sm font-bold text-gray-400 uppercase tracking-wider">Тип исследования</th>
                        <th className="px-4 py-3 text-sm font-bold text-gray-400 uppercase tracking-wider">Интервьюеры</th>
                        <th className="px-4 py-3 text-sm font-bold text-gray-400 uppercase tracking-wider">
                          <button className="flex items-center gap-1 hover:text-gray-600">
                            Дата заявки <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-sm font-bold text-gray-400 uppercase tracking-wider">Начало</th>
                        <th className="px-4 py-3 text-sm font-bold text-gray-400 uppercase tracking-wider">Конец</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedResearches.length > 0 ? paginatedResearches.map((res) => (
                        <tr 
                          key={res.id} 
                          className="hover:bg-gray-50 group cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedResearch(res);
                            setCurrentScreen('details');
                          }}
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 truncate max-w-[300px] block">
                              {res.title}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <StatusPill status={res.type} type="type" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-sm rounded-sm font-medium">{res.primaryInterviewer}</span>
                              {res.additionalInterviewers?.map(i => (
                                <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-sm rounded-sm font-medium">{i}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">{res.requestDate}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">{res.startDate}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">{res.endDate}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-1 hover:bg-gray-200 rounded-sm text-gray-400">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm italic">
                            Исследований не найдено
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {filteredResearches.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between font-medium text-sm text-gray-500">
                      <span>Показано {paginatedResearches.length} из {filteredResearches.length}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          disabled={currentPage === 1}
                          onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }}
                          className="p-1 border border-gray-300 rounded-sm disabled:opacity-30 hover:bg-white"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span>Стр. {currentPage}</span>
                        <button 
                          disabled={paginatedResearches.length < itemsPerPage}
                          onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}
                          className="p-1 border border-gray-300 rounded-sm disabled:opacity-30 hover:bg-white"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-7xl mx-auto"
              >
                <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#FFD700]"></div>
                    <div className="flex items-center justify-between mb-6">
                      <StatusPill status={selectedResearch?.type || 'интервью'} type="type" />
                    </div>
                    <h1 className="text-xl font-bold mb-6 text-gray-900">{selectedResearch?.title}</h1>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase mb-1">Интервьюеры</p>
                        <div className="flex flex-wrap gap-2">
                           <div className="flex items-center gap-1.5">
                             <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                               <User className="w-2.5 h-2.5 text-blue-600" />
                             </div>
                             <span className="text-sm font-semibold">{selectedResearch?.primaryInterviewer}</span>
                           </div>
                           {selectedResearch?.additionalInterviewers?.map(i => (
                             <span key={i} className="text-sm text-gray-500">{i}</span>
                           ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase mb-1">Вознаграждение</p>
                        <p className="text-sm font-semibold">{selectedResearch?.reward}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase mb-1">Дата заявки</p>
                        <p className="text-sm">{selectedResearch?.requestDate}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase mb-1">Дата начала и конца исследования</p>
                        <p className="text-sm flex items-center gap-2 font-medium">
                          {selectedResearch?.startDate} <span className="text-gray-300">→</span> {selectedResearch?.endDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
                      <div className="flex items-center justify-between mb-6 text-gray-900">
                        <h3 className="text-sm font-bold uppercase tracking-wider">Статусы обзвона</h3>
                        <div className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-sm text-sm">
                          Всего в выборке: <span className="font-bold">{currentRespondents.length}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-8 items-center min-h-[200px]">
                        <div className="w-full md:w-1/2 h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={respondentStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {[
                                  '#FDBA74', 
                                  '#93C5FD', 
                                  '#86EFAC', 
                                  '#FCA5A5', 
                                  '#D1D5DB', 
                                  '#94A3B8'  
                                ].map((color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ fontSize: '14px', borderRadius: '4px' }}
                                itemStyle={{ fontWeight: 'bold' }}
                                formatter={(value: number) => [`${value} чел.`, 'Кол-во']}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/2 space-y-2">
                           {respondentStats.map((stat, idx) => (
                             <div key={stat.name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                               <div className="flex items-center gap-2">
                                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#FDBA74', '#93C5FD', '#86EFAC', '#FCA5A5', '#D1D5DB', '#94A3B8'][idx] }}></div>
                                 <span className="text-sm text-gray-600">{stat.name}</span>
                               </div>
                               <span className="text-sm font-bold">{stat.value} чел.</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-blue-500" />
                        Статус выплат
                      </h3>
                      <div className="space-y-3">
                        {paymentSummary.map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{label}</span>
                            <span className="text-sm font-bold px-2 py-0.5 bg-gray-50 rounded-sm border border-gray-100">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider">Респонденты</h3>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input 
                          type="text" 
                          placeholder="Поиск по Имени или SIEBEL-ID..."
                          className="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-sm w-64 focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                          value={respondentSearch}
                          onChange={(e) => setRespondentSearch(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select 
                          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                          value={respondentPaymentFilter}
                          onChange={(e) => setRespondentPaymentFilter(e.target.value as any)}
                        >
                          <option value="все">Все статусы оплаты</option>
                          <option value="Оплачено">Оплачено</option>
                          <option value="Не оплачено">Не оплачено</option>
                          <option value="Нет статуса прихода">Нет статуса прихода</option>
                          <option value="Согласились">Согласились</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/30 border-b border-gray-200">
                          <th className="px-6 py-3 text-sm font-bold text-gray-400 uppercase">Имя и фамилия</th>
                          <th className="px-4 py-3 text-sm font-bold text-gray-400 uppercase">SIEBEL-ID</th>
                          <th className="px-4 py-3 text-sm font-bold text-gray-400 uppercase">Статус обзвона</th>
                          <th className="px-4 py-3 text-sm font-bold text-gray-400 uppercase">Статус оплаты</th>
                          <th className="px-6 py-3 text-sm font-bold text-gray-400 uppercase">Дата и время встречи</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentRespondents.map((resp) => (
                          <tr key={resp.id} className="hover:bg-gray-50 text-sm">
                            <td className="px-6 py-3 font-medium text-gray-900">{resp.fullName}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 font-mono tracking-tight">{resp.siebelId}</td>
                            <td className="px-4 py-3">
                              <StatusPill status={resp.callStatus} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill status={resp.paymentStatus} />
                            </td>
                            <td className="px-6 py-3 text-gray-500 tabular-nums">
                              {resp.meetingDate ? (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  {resp.meetingDate}, {resp.meetingTime}
                                </div>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
