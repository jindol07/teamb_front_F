import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { parkingUsageRatioMock } from '../../../mock/parkingMock';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

/**
 * ParkingPieChart
 * 주차장 이용 현황(주차중 / 잔여 / 예약)을 Doughnut Chart로 보여줍니다.
 */
export default function ParkingPieChart() {
  const { labels, values } = parkingUsageRatioMock;

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: ['#3d6ee0', '#a7c0f2', '#f2b705'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: { display: true, text: '주차장 이용 현황' },
      legend: { display: true, position: 'bottom' as const },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="card p-3 h-100">
      <Doughnut data={data} options={options} />
    </div>
  );
}
