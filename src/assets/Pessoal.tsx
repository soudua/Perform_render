import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Box from '@mui/joy/Box';
import Slider from '@mui/joy/Slider';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { createApiUrl, apiConfig } from '../utils/apiConfig';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import Autocomplete from '@mui/joy/Autocomplete';


export default function Pessoal() {
  const { user_id } = useOutletContext<{ user_id: number | null }>();
  const [progressWidth, setProgressWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0-11 for Jan-Dec
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [projectOptions, setProjectOptions] = useState<{ label: string; id: number }[]>([]);
  const [selectedProject, setSelectedProject] = useState<{ label: string; id: number } | null>(null);
  const [pieData, setPieData] = useState<{ id: number; value: number; label: string }[]>([]);
  const [totalProjectHours, setTotalProjectHours] = useState<number>(0);
  const [availableHours, setAvailableHours] = useState<number | null>(null);
  const [horasNormais, setHorasNormais] = useState<number>(0);
  const [horasFaturaveis, setHorasFaturaveis] = useState<number>(0);
  const [horasExtra, setHorasExtra] = useState<number>(0);

  const images = ['/graph2.png', '/piecharts1.png'];

  const months = [
    'Janeiro 2025', 'Fevereiro 2025', 'Março 2025', 'Abril 2025',
    'Maio 2025', 'Junho 2025', 'Julho 2025', 'Agosto 2025',
    'Setembro 2025', 'Outubro 2025', 'Novembro 2025', 'Dezembro 2025'
  ];

  function valueText(value: number) {
    return months[value];
  }

  const clampedProgress = Math.min(100, Math.max(0, progressWidth));

  useEffect(() => {
    if (!user_id) return;
    const year = 2025;
    const month = selectedMonth;
    const start = new Date(year, month, 1, 0, 0, 0, 0).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
    axios.get(createApiUrl(apiConfig.endpoints.userMonthHours), {
      params: { user_id, start, end }
    })
      .then(res => {
        const total = res.data?.total || 0;
        const percent = Math.floor((total / 176) * 100);
        setProgressWidth(percent);
      })
      .catch(() => setProgressWidth(0));
  }, [user_id, selectedMonth]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user_id) return;
    axios.get(createApiUrl(apiConfig.endpoints.projectsByUser), { params: { user_id } })
      .then(res => {
        const projects = res.data?.projects || [];
        setProjectOptions(projects.map((name: string, idx: number) => ({ label: name, id: idx })));
      })
      .catch(() => setProjectOptions([]));
  }, [user_id]);

  useEffect(() => {
    if (projectOptions.length > 0 && !selectedProject) {
      setSelectedProject(projectOptions[0]);
    }
  }, [projectOptions]);

  useEffect(() => {
    if (!selectedProject) {
      setPieData([]);
      setTotalProjectHours(0);
      return;
    }
    // 1. Get project_id by project_name
    axios.get(createApiUrl(apiConfig.endpoints.projectId), { params: { name: selectedProject.label } })
      .then(res => {
        const project_id = res.data?.project_id;
        if (!project_id) {
          setPieData([]);
          setTotalProjectHours(0);
          return;
        }
        // 2. Get people and hours for this project
        axios.get(createApiUrl(apiConfig.endpoints.projectPeopleHours), { params: { project_id } })
          .then(res2 => {
            setPieData(res2.data?.people || []);
            setTotalProjectHours(res2.data?.totalHours || 0);
          })
          .catch(() => {
            setPieData([]);
            setTotalProjectHours(0);
          });
      })
      .catch(() => {
        setPieData([]);
        setTotalProjectHours(0);
      });
  }, [selectedProject]);

  useEffect(() => {
    if (!user_id) return;
    axios.get(createApiUrl(apiConfig.endpoints.userAvailableHours), { params: { user_id } })
      .then(res => {
        setAvailableHours(res.data.availableHours);
      })
      .catch(() => {
        setAvailableHours(null);
      });
  }, [user_id]);

  useEffect(() => {
    if (!user_id || !selectedProject) {
      setHorasNormais(0);
      setHorasFaturaveis(0);
      setHorasExtra(0);
      return;
    }
    axios.get(createApiUrl(apiConfig.endpoints.projectId), { params: { name: selectedProject.label } })
      .then(res => {
        const project_id = res.data?.project_id;
        if (!project_id) {
          setHorasNormais(0);
          setHorasFaturaveis(0);
          setHorasExtra(0);
          return;
        }
        axios.get(createApiUrl(apiConfig.endpoints.projectHoursBreakdown), { params: { user_id, project_id } })
          .then(res2 => {
            setHorasNormais(res2.data?.horasNormais || 0);
            setHorasFaturaveis(res2.data?.horasFaturaveis || 0);
            setHorasExtra(res2.data?.horasExtra || 0);
          })
          .catch(() => {
            setHorasNormais(0);
            setHorasFaturaveis(0);
            setHorasExtra(0);
          });
      })
      .catch(() => {
        setHorasNormais(0);
        setHorasFaturaveis(0);
        setHorasExtra(0);
      });
  }, [user_id, selectedProject]);

  const faturacaoPercent = (horasNormais > 0) ? Math.round((horasFaturaveis / horasNormais) * 100) : 0;
const extrasPercent = (horasNormais > 0) ? Math.round((horasExtra / horasNormais) * 100) : 0;

  return (
    <>
      <div className="flex flex-row items-center justify-center gap-4 w-full">
        <div className='w-2/4 text-lg h-16 bg-[#FFFFF2] border-1 shadow-lg rounded-full font-bold text-gray-500'>
          <div className='flex justify-around items-center h-full w-full px-4'>
            <div className='flex flex-row gap-3'>
              <div>
                Projeto: 
              </div>
              <div>
                <Autocomplete
                      placeholder="Projeto..."
                      options={projectOptions}
                      value={selectedProject}
                      onChange={(_, v) => setSelectedProject(v)}
                      sx={{ width: 200 }}
                    />
              </div>
              </div>
            <div>Data:</div>
          </div>
        </div>
        <div className='w-1/4 h-16 bg-[#FFFFF2] border-1 shadow-lg rounded-full flex items-center justify-center overflow-hidden relative'>
  <AnimatePresence mode="wait">
    <motion.img
      key={images[currentImageIndex]}
      src={images[currentImageIndex]}
      alt="slider"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="h-12 object-contain absolute"
    />
  </AnimatePresence>
</div>

      </div>
      
        
      

      <div className='flex flex-row gap-8 justify-center mt-9'>
        <div className='p-6 mb-8 rounded-2xl bg-white w-2/4 shadow-lg'>
          <p className="font-bold text-xl mb-4">Horas Registadas</p>
          <div className='flex justify-center items-center mb-2'>
            <Box sx={{ width: 300 }}>
              <Slider
                aria-label="Month slider"
                value={selectedMonth}
                onChange={(_, value) => setSelectedMonth(value as number)}
                getAriaValueText={valueText}
                step={1}
                marks={months.map((_, index) => ({
                  value: index,
                  label: index === 0 || index === 11 ? months[index].split(' ')[0] : ''
                }))}
                min={0}
                max={11}
                valueLabelDisplay="on"
                valueLabelFormat={valueText}
              />
            </Box>
          </div>
          <div className="text-center py-2 font-medium mb-4">
            {months[selectedMonth]}
          </div>
          <div className="flex justify-center">
            <div className="w-2/3 border-4 rounded-2xl relative shadow-lg h-7 bg-gray-100 overflow-hidden flex items-center"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div
                className={`absolute left-0 top-0 h-full transition-all duration-300 bg-green-300 hover:bg-green-400 ${clampedProgress === 100 ? 'rounded-2xl' : 'rounded-s-2xl'}`}
                style={{ width: `${clampedProgress}%`, zIndex: 1 }}
              ></div>
              <div
                className="absolute top-0 h-full w-0.5 bg-red-500"
                style={{ left: '80%', zIndex: 2 }}
              ></div>
              <div
                className="absolute -top-6 text-xs text-red-500 font-bold"
                style={{ left: '80%', transform: 'translateX(-50%)', zIndex: 3 }}
              >
                Meta 80%
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-lg shadow-lg border border-gray-200 z-10"
                  >
                    <div className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">Horas Registadas: {clampedProgress}%</span>
                      <div className='w-3 h-3 bg-green-400 border border-gray-300'></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Meta de Horas Registadas: 80%
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className='p-6 mb-8 rounded-2xl bg-white w-1/4 shadow-lg'>
          <div className='font-bold text-xl'>Percentagem Horas</div>
          <div className='flex flex-row justify-around pt-5'>
            <div>
              <div className='font-bold text-xl text-gray-500'>Faturação</div>
              <div className='font-bold text-4xl'>{faturacaoPercent} %</div>
            </div>
            <div>
              <div className='font-bold text-xl text-gray-500'>Extras</div>
              <div className='font-bold text-4xl'>{extrasPercent} %</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-row gap-8 justify-center items-start mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col w-1/3">
          <div className='justify-start font-bold text-xl'>
            Horas do Projeto
          </div>
          <div className='flex justify-center items-center'>
            <PieChart
              series={[
                {
                  data: pieData,
                },
              ]}
              width={200}
              height={350}
            />
          </div>
          <div className='font-bold text-xl text-gray-500'>
            Horas totais
          </div>
          <div className='font-bold text-4xl text-gray-700'>{totalProjectHours}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-2 flex-1 max-w-[688px] h-[476px]">
          <div className='font-bold text-xl'>Distribuição de Horas</div>          <BarChart
            xAxis={[{ data: [''] }]}
            series={[
              { data: [Math.round(availableHours !== null ? availableHours : 0)], color: '#FEEDC3' },
              { data: [80], color: '#E87461' },
              { data: [Math.round(horasNormais)], color: '#4ade80' },
              { data: [Math.round(horasFaturaveis)], color: '#60a5fa' },
              { data: [Math.round(horasExtra)], color: '#fbbf24' }
            ]}
            height={300}
            barLabel="value"
          />
          <div className='flex flex-row gap-5 items-center justify-center mt-4 mb-2'>
            <div className='flex flex-row items-center gap-1'>
              <div className='w-7 h-7 bg-[#FEEDC3] rounded-full'></div>
              <div className='font-semibold text-gray-600'>Horas Disponiveis </div>
            </div>
            <div className='flex flex-col gap-3'>
              <div className='flex flex-row items-center gap-1'>
                <div className='w-7 h-7 bg-[#E87461] rounded-full'></div>
                <div className='font-semibold text-gray-600'>Horas Registadas</div>
              </div>
              <div className='flex flex-row items-center gap-1'>
                <div className='w-7 h-7 bg-green-300 rounded-full'></div>
                <div className='font-semibold text-gray-600'>Horas Normais</div>
              </div>
            </div>
            <div className='flex flex-col gap-3'>
              <div>
                <div className='flex flex-row items-center gap-1'>
                  <div className='w-7 h-7 bg-blue-400 rounded-full'></div>
                  <div className='font-semibold text-gray-600'>Horas Fatoráveis</div>
                </div>
              </div>
              <div>
                <div className='flex flex-row items-center gap-1 '>
                  <div className='w-7 h-7 bg-yellow-400 rounded-full'></div>
                  <div className='font-semibold text-gray-600'>Horas Extra</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
