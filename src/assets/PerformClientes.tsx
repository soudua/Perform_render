import { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { apiConfig, createApiUrl } from '../utils/apiConfig';

export default function PerformClientes() {
  const [selectedProject, setSelectedProject] = useState("");
  const [activeView, setActiveView] = useState('Geral');
  const [projects, setProjects] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ user_id: number; First_Name: string; Last_Name: string }>>([]);
  const [totalProjectHours, setTotalProjectHours] = useState<number>(0);
  const [timelineData, setTimelineData] = useState<{
    startDate: string | null;
    endDate: string | null;
    completionPercentage: number;
  }>({ startDate: null, endDate: null, completionPercentage: 0 });
  const [totalCost, setTotalCost] = useState<number>(0);
  const [budgetData, setBudgetData] = useState<{
    budget: number;
    currentCost: number;
    completionPercentage: number;
  }>({ budget: 0, currentCost: 0, completionPercentage: 0 });
  const [monthlyRisks, setMonthlyRisks] = useState<number[]>(Array(12).fill(0));

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(createApiUrl(apiConfig.endpoints.allProjects));
        const projectNames = response.data || [];
        setProjects(projectNames);
        if (projectNames.length > 0) {
          setSelectedProject(projectNames[0]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchTeamMembers = async () => {
      try {
        console.log('Fetching team members for project:', selectedProject);  // Debug log
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectUsers + encodeURIComponent(selectedProject))
        );
        console.log('Team members response:', response.data);  // Debug log
        setTeamMembers(response.data);
      } catch (error) {
        setTeamMembers([]);
        console.error('Error fetching team members:', error);
      }
    };
    fetchTeamMembers();
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchTotalHours = async () => {
      try {
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectTotalHours + '/' + encodeURIComponent(selectedProject))
        );
        setTotalProjectHours(response.data.totalHours || 0);
      } catch (error) {
        console.error('Error fetching total hours:', error);
        setTotalProjectHours(0);
      }
    };
    fetchTotalHours();
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchTimeline = async () => {
      try {
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectTimeline + '/' + encodeURIComponent(selectedProject))
        );
        setTimelineData(response.data);
      } catch (error) {
        console.error('Error fetching timeline:', error);
        setTimelineData({ startDate: null, endDate: null, completionPercentage: 0 });
      }
    };
    fetchTimeline();
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchProjectCost = async () => {
      try {
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectCost + '/' + encodeURIComponent(selectedProject))
        );
        setTotalCost(response.data.totalCost || 0);
      } catch (error) {
        console.error('Error fetching project cost:', error);
        setTotalCost(0);
      }
    };
    fetchProjectCost();
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchProjectBudget = async () => {
      try {
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectBudget + '/' + encodeURIComponent(selectedProject))
        );
        setBudgetData(response.data);
      } catch (error) {
        console.error('Error fetching project budget:', error);
        setBudgetData({ budget: 0, currentCost: 0, completionPercentage: 0 });
      }
    };
    fetchProjectBudget();
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const fetchMonthlyRisks = async () => {
      try {
        const response = await axios.get(
          createApiUrl(apiConfig.endpoints.projectRiskByMonth + '/' + encodeURIComponent(selectedProject))
        );
        setMonthlyRisks(response.data.monthlyRisks || Array(12).fill(0));
      } catch (error) {
        console.error('Error fetching monthly risks:', error);
        setMonthlyRisks(Array(12).fill(0));
      }
    };
    fetchMonthlyRisks();
  }, [selectedProject]);

  const projectMetrics = {
    budget: 50000,
    spent: 32000,
    timeline: 75,
    risk: 'low',
    cpi: 0.8
  };

  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = "#3b82f6" }: { percentage: number; size?: number; strokeWidth?: number; color?: string }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{percentage}%</span>
        </div>
      </div>
    );
  };

  const TeamMemberCard = ({ member, index }: { member: { user_id: number; First_Name: string; Last_Name: string }; index: number }) => {
    const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];
    const bgColor = colors[index % colors.length];
    const [role, setRole] = useState('Loading...');
    const [hours, setHours] = useState<number>(0);

    useEffect(() => {
      const fetchRole = async () => {
        try {
          const response = await axios.get(
            createApiUrl(apiConfig.endpoints.userRoles + '/' + member.user_id)
          );
          setRole(response.data.role || 'N/A');
        } catch (error) {
          console.error('Error fetching role:', error);
          setRole('N/A');
        }
      };
      fetchRole();
    }, [member.user_id]);

    useEffect(() => {
      const fetchHours = async () => {
        try {
          const response = await axios.get(
            createApiUrl(apiConfig.endpoints.userHours + '/' + encodeURIComponent(selectedProject) + '/' + member.user_id)
          );
          setHours(response.data.totalHours || 0);
        } catch (error) {
          console.error('Error fetching hours:', error);
          setHours(0);
        }
      };
      if (selectedProject) {
        fetchHours();
      }
    }, [member.user_id, selectedProject]);

    return (
      <div className="relative overflow-hidden rounded-2xl p-6 text-white" style={{ backgroundColor: bgColor }}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
              {member.First_Name[0]}
            </div>
            <div>
              <h3 className="font-bold text-lg">{member.First_Name} {member.Last_Name}</h3>
              <h1 className='font-semibold'>Horas: {hours.toFixed(2)}</h1>
              <p className="text-sm opacity-80">{role}</p>
            </div>
          </div>
          {/* You can add more info here if needed */}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Análise de Projeto</h1>
            <div className="hidden sm:block h-8 w-px bg-gray-400"></div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
            >
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['Geral', 'Equipa', 'Métricas'].map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-5 py-2 rounded-full transition-all text-sm sm:text-base ${activeView === view ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'}`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        {activeView === 'Geral' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                <div className='bg-blue-200 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-gray-500 font-bold'>
                  <div>Horas Registadas</div>
                  <div className='flex flex-row justify-between pt-2'>
                    <div className='text-black text-2xl'>{totalProjectHours.toFixed(2)}</div>
                    <div className='text-xl'>⏱️</div>
                  </div>
                  <div className='flex flex-row pt-2 gap-1'>
                    <div className='text-green-500 text-sm'>+ 30 H</div>
                    <div className='text-gray-500 text-sm'>do que semana passada</div>
                  </div>
                </div>
                <div className='bg-green-200 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-gray-500 font-bold'>
                  <div>Eficácia</div>
                  <div className='flex flex-row justify-between pt-2'>
                    <div className='text-black text-2xl'>88%</div>
                    <div className='text-xl'>⚡</div>
                  </div>
                  <div className='flex flex-row pt-2 gap-1'>
                    <div className='text-green-500 text-sm'>+2.1%</div>
                    <div className='text-gray-400 text-sm'>do que semana passada</div>
                  </div>
                </div>
                <div className='bg-yellow-200 rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-gray-500 font-bold'>
                  <div>Custo</div>
                  <div className='flex flex-row justify-between pt-2'>
                    <div className='text-black text-2xl'>
                      €{(totalCost >= 1000 ? (totalCost/1000).toFixed(1) + 'K' : totalCost.toFixed(0))}
                    </div>
                    <div className='text-xl'>💰</div>
                  </div>
                  <div className='flex flex-row pt-2 gap-1'>
                    <div className='text-red-500 text-sm'>+2k</div>
                    <div className='text-gray-400 text-sm'>do que semana passada</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold mb-6 text-red-600">Risco do Projeto</h3>
                <LineChart
                  xAxis={[{ 
                    data: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], 
                    scaleType: 'band' 
                  }]}
                  yAxis={[{ 
                    min: 0, 
                    max: 100, 
                    label: 'Risco do Projeto (%)',
                    labelStyle: { fill: '#666' }
                  }]}
                  series={[{ 
                    data: monthlyRisks, 
                    area: true, 
                    color: '#FF4063',
                    showMark: true,
                    label: 'Risco Mensal'
                  }]}
                  height={300}
                />
                <div className="mt-4 text-sm text-gray-600 text-center">
                  Percentual do orçamento gasto por mês
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center">
                <h3 className="text-lg font-semibold mb-4 text-purple-600">Progresso do Budget</h3>
                <CircularProgress percentage={budgetData.completionPercentage} color="#a855f7" />
                <div className="mt-4 text-sm text-gray-600">
                  €{budgetData.currentCost.toLocaleString(undefined, {maximumFractionDigits: 0})} / 
                  €{budgetData.budget.toLocaleString(undefined, {maximumFractionDigits: 0})}
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center">
                <h3 className="text-lg font-semibold mb-4 text-green-600">Cronologia</h3>
                <CircularProgress percentage={timelineData.completionPercentage} color="#10b981" />
                <div className="mt-4 text-sm text-gray-600">
                  {timelineData.startDate ? 
                    `${new Date(timelineData.startDate).toLocaleDateString()} - ${new Date(timelineData.endDate || '').toLocaleDateString()}` 
                    : 'Datas não disponíveis'}
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-yellow-600">CPI</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-500">{projectMetrics.cpi}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    {projectMetrics.cpi > 1 ? 'Acima de Budget' : 'Dentro de Budget'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team View */}
        {activeView === 'Equipa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <TeamMemberCard key={member.user_id} member={member} index={index} />
            ))}
          </div>
        )}

        {/* Metrics View */}
        {activeView === 'Métricas' && (
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold mb-6 text-blue-600">Análise de Risco</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-gray-700">Risco de Budget</span>
                  <span className="text-green-600 font-bold">Baixo</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <span className="text-gray-700">Risco de Tempo</span>
                  <span className="text-yellow-600 font-bold">Medio</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-gray-700">Risco de Recurso</span>
                  <span className="text-red-600 font-bold">Alto</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold mb-6 text-purple-600">Vista Financeira</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Revenue</span>
                    <span className="text-green-600 font-semibold">€45,000</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 rounded-full h-3" style={{ width: '90%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Costs</span>
                    <span className="text-red-600 font-semibold">€32,000</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div className="bg-red-500 rounded-full h-3" style={{ width: '64%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Profit Margin</span>
                    <span className="text-blue-600 font-semibold">28.9%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-500 rounded-full h-3" style={{ width: '29%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
