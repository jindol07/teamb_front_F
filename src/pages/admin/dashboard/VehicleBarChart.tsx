import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { hourlyUsageMock } from '../../../mock/parkingMock';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * VehicleBarChart
 * 시간대별 차량 이용량을 Bar Chart로 보여줍니다.
 */
export default function VehicleBarChart() {
  const { labels, values } = hourlyUsageMock;

  const data = {
    labels,
    datasets: [
      {
        label: '차량 이용량 (대)',
        data: values,
        backgroundColor: '#3d6ee0',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: { display: true, text: '시간대별 차량 이용량' },
      legend: { display: true, position: 'bottom' as const },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: '차량 수 (대)' },
      },
      x: {
        title: { display: true, text: '시간대' },
      },
    },
  };

  return (
    <div className="card p-3 h-100">
      <Bar data={data} options={options} />
    </div>
  );
}
