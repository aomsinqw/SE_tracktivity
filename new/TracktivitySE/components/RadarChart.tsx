import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadarController,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  RadialLinearScale
} from 'chart.js';

// Register the components needed for Radar chart
ChartJS.register(
  RadarController,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  RadialLinearScale
);

// Define the type for skill
interface Skill {
  name: string;
  level: number;
}

// Define the type for props
interface RadarChartProps {
  skills: Skill[];
}

const RadarChart: React.FC<RadarChartProps> = ({ skills = [] }) => {
  const skillNames = [
    'Teamwork',
    'Adaptability to Technological Changes',
    'Interdisciplinary Collaboration',
    'Effective Communication',
    'Entrepreneurial Mindset',
    'Innovation Mindset'
  ];

  const skillLevels = skillNames.map(name => {
    const skill = skills.find(skill => skill.name === name);
    return skill ? skill.level : 0;
  });

  const data = {
    labels: skillNames,
    datasets: [
      {
        label: 'Skills Earned',
        data: skillLevels,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: false
        },
        suggestedMin: 1,
        suggestedMax: 5,
        grid: {
          color: '#e3e3e3'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const, 
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: { raw: number }) => {
            return `Level: ${tooltipItem.raw}`;
          }
        }
      }
    }
  };

  return <Radar data={data} />;
};

export default RadarChart;
