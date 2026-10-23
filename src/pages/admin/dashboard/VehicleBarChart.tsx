/** DAILY_PARKING_SUMMARY의 일별 집계를 Chart.js 그룹 막대로 표시한다. */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { DailyParkingSummaryRow, DashboardPeriod } from './dashboardApi';
import styles from './AdminDashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface VehicleBarChartProps {
  rows: DailyParkingSummaryRow[];
  loading: boolean;
  error: string | null;
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
}

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { usePointStyle: true, boxWidth: 8, padding: 20 },
    },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#718096' },
    },
    y: {
      beginAtZero: true,
      border: { display: false },
      ticks: { precision: 0, color: '#718096' },
      grid: { color: '#edf1f7' },
      title: { display: true, text: '건수' },
    },
  },
};

export default function VehicleBarChart({
  rows,
  loading,
  error,
  period,
  onPeriodChange,
}: VehicleBarChartProps) {
  const rangeLabel = period === 'week' ? '최근 7일' : '최근 30일';
  const periodOptions: ChartOptions<'bar'> = {
    ...options,
    scales: {
      ...options.scales,
      x: {
        ...options.scales?.x,
        ticks: {
          color: '#718096',
          autoSkip: true,
          maxTicksLimit: period === 'week' ? 7 : 10,
          maxRotation: 0,
        },
      },
    },
  };
  const data: ChartData<'bar'> = {
    labels: rows.map((row) => row.summaryDate.slice(5).replace('-', '/')),
    datasets: [
      {
        label: '주차 이용',
        data: rows.map((row) => row.usageCount),
        backgroundColor: '#4f7bec',
        borderRadius: 4,
        maxBarThickness: 20,
      },
      {
        label: '예약',
        data: rows.map((row) => row.reservationCount),
        backgroundColor: '#a390da',
        borderRadius: 4,
        maxBarThickness: 20,
      },
      {
        label: '방문 차량 이용',
        data: rows.map((row) => row.visitorCount),
        backgroundColor: '#65b5a3',
        borderRadius: 4,
        maxBarThickness: 20,
      },
    ],
  };
  return (
    <section className={styles.panel} aria-labelledby="dashboard-chart-title">
      <div className={styles.panelHeading}>
        <div>
          <h2 id="dashboard-chart-title">일별 주차·예약 통계</h2>
          <p>{rangeLabel} · 오늘 포함 · 저장된 일별 집계 기준</p>
        </div>
        <label className={styles.periodControl}>
          <span>조회 기간</span>
          <select
            value={period}
            onChange={(event) => onPeriodChange(event.target.value as DashboardPeriod)}
          >
            <option value="week">주간</option>
            <option value="month">월간</option>
          </select>
        </label>
      </div>
      {loading ? (
        <div className={styles.chartMessage} role="status">
          통계를 불러오고 있습니다.
        </div>
      ) : error ? (
        <div className={styles.chartMessage} role="alert">
          통계 조회 실패
          <br />
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className={styles.chartMessage}>
          집계된 통계가 없습니다.
          <small>일별 통계 데이터가 저장되면 차트가 표시됩니다.</small>
        </div>
      ) : (
        <div className={styles.chart}>
          <Bar
            data={data}
            options={periodOptions}
            role="img"
            aria-label={`${rangeLabel} 주차 이용·예약·방문 차량 이용 건수`}
          />
          <table className={styles.srOnly}>
            <caption>일별 주차 통계</caption>
            <thead>
              <tr>
                <th>날짜</th>
                <th>주차 이용</th>
                <th>예약</th>
                <th>방문 이용</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.summaryDate}>
                  <th>{row.summaryDate}</th>
                  <td>{row.usageCount}</td>
                  <td>{row.reservationCount}</td>
                  <td>{row.visitorCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.caption}>
        방문 차량 이용은 전체 주차 이용과 합산하지 않습니다. 집계가 없는 날짜는 표시하지
        않습니다.
      </p>
    </section>
  );
}
