import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firestore/firebase';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';

const SKILLS = [
  { name: 'Teamwork' },
  { name: 'Adaptability to Technological Changes' },
  { name: 'Interdisciplinary Collaboration' },
  { name: 'Effective Communication' },
  { name: 'Entrepreneurial Mindset' },
  { name: 'Innovation Mindset' },
];

interface User {
  firstname_EN: string;
  lastname_EN: string;
  student_id: string;
}

interface Skill {
  name: string;
  level: number;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  skills: Skill[];
  status: 'pending' | 'approved';
  createdAt: Date;
  fileUrl: string | null;
  userId: string;
  firstname: string;
  lastname: string;
  studentId: string;
}

function PendingActivitiesPage() {
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const router = useRouter();  
  const rubricLink = 'https://docs.google.com/spreadsheets/d/1d56duW1NtohrWGKjZvy1jsIf9ssFABh8o-WeFJ3O2kY/edit?usp=sharing';
  
  
  const handleViewRubric = () => {
    // Opens the rubric in a new tab
    window.open(rubricLink, '_blank');
  };

  const signOut = async () => {
    try {
      console.log('Attempting to sign out...');
      const response = await axios.post('/api/signOut');
      console.log('Sign out response:', response.data);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  useEffect(() => {
    const fetchPendingActivities = () => {
      const q = query(collection(db, 'PendingActivities'), where('status', '==', 'pending'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const pendingList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Activity[];
        setPendingActivities(pendingList);
      });
      return () => unsubscribe();
    };

    fetchPendingActivities();
  }, []);

  const editActivity = async (activityId: string, updatedData: Partial<Activity>) => {
    try {
      const activityRef = doc(db, 'PendingActivities', activityId);
      await updateDoc(activityRef, updatedData);
    } catch (error) {
      console.error('Error updating activity: ', error);
      alert('Failed to update activity. Please try again.');
    }
  };

  const approveActivity = async (activityId: string) => {
    try {
      const activityRef = doc(db, 'PendingActivities', activityId);
      await updateDoc(activityRef, { status: 'approved' });
      alert('Activity approved!');
    } catch (error) {
      console.error('Error approving activity: ', error);
      alert('Failed to approve activity. Please try again.');
    }
  };

  const addSkill = (activityId: string) => {
    const activity = pendingActivities.find((activity) => activity.id === activityId);
    if (activity) {
      const updatedSkills = [
        ...activity.skills,
        { name: '', level: 1 },
      ];
      editActivity(activityId, { skills: updatedSkills });
    }
  };

  const deleteSkill = (activityId: string, skillIndex: number) => {
    const activity = pendingActivities.find((activity) => activity.id === activityId);
    if (activity) {
      const updatedSkills = activity.skills.filter((_, index) => index !== skillIndex);
      editActivity(activityId, { skills: updatedSkills });
    }
  };

  const handleSkillChange = (activityId: string, index: number, field: 'name' | 'level', value: string | number) => {
    const activity = pendingActivities.find((activity) => activity.id === activityId);
    if (activity) {
      const updatedSkills = [...activity.skills];
      if (field === 'name') {
        updatedSkills[index].name = value as string;
      } else {
        updatedSkills[index].level = value as number;
      }
      editActivity(activityId, { skills: updatedSkills });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-cover bg-center" style={{ backgroundImage: `url('/TracktivityBG.png')` }}>
      {/* Navbar */}
      <div className="navbar bg-customColor1 text-primary-content p-4 fixed top-0 left-0 w-full z-50"
      style={{ fontFamily: '"Times New Roman", Times, serif', fontWeight: 'bold' }}>
        <div className="flex-1">
          <Link href="/admin-page" className="btn btn-ghost text-xl text-white">
            ADMIN DASHBOARD
          </Link>
        </div>
        <div className="flex-1">
          <li>
            <Link href="/activities-admin" className="btn btn-ghost text-xl text-white">
              Activities Page
            </Link>
          </li>
        </div>
        <div className="flex-1">
          <li>
            <Link href="/post-activity" className="btn btn-ghost text-xl text-white">
              Post Activities
            </Link>
          </li>
        </div>
        <div className="flex-0">
          <li>
            <Link href="/pending-activities" className="btn btn-ghost text-xl text-white">
              Students&#39; Pending Activities
            </Link>
          </li>
        </div>
        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                  <img
                    alt="Admin"
                    src="/CMUEng.jpg"
                  />
              </div>
            </div>
            <ul className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow text-black">
              <li><button onClick={signOut} className="cursor-pointer">Logout</button></li>
            </ul>
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-red-800"
        style={{
          fontFamily: '"Times New Roman", Times, serif',
          color: '#ffffff',
          marginTop: '100px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textShadow: `
                    0 0 5px #00ffee, 
                    0 0 10px #00ffee, 
                    0 0 15px #00ffee, 
                    0 0 20px #00ffee
                  `
        }}
      >Pending Activities</h2>

      {/* View Rubric Button */}
      <div className="mb-8 flex justify-center">
        <button
          type="button" // Prevents form submission
          onClick={handleViewRubric}
          className="text-white px-4 py-2 rounded-full mt-4"
              style={{
                background: '#00FF66', // Set base background color
                fontSize: '1.5vw',
                fontFamily: '"Times New Roman", Times, serif',
                fontWeight:'bold',
                transition: 'background-color 0.1s', // Smooth transition for hover effect
              }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#33CC66')} // Set hover background color
            onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = '#00FF66')} // Reset background on hover out
        >
          View Skills Rubric
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {pendingActivities.map((activity) => (
          <div key={activity.id} className="bg-white border border-gray-300 rounded-3xl shadow-lg p-6 flex flex-col">
            <h3 className="text-2xl font-bold text-red-800 mb-4"
              style={{
                fontFamily: '"Times New Roman", Times, serif',
              }}
            >{activity.name}</h3>
            <p className="text-gray-700 mb-3 -mt-3"
              style={{
                fontFamily: '"Times New Roman", Times, serif',
              }}
            >{activity.description}</p>

            <ul className="mb-4 space-y-2">
              {activity.skills.map((skill, index) => (
                <li key={index} className="flex items-center gap-2">
                  <select
                    value={skill.name}
                    onChange={(e) => handleSkillChange(activity.id, index, 'name', e.target.value)}
                    className="border border-gray-300 px-3 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                  >
                    {SKILLS.map((option, optionIndex) => (
                      <option key={optionIndex} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={skill.level}
                    onChange={(e) =>
                      handleSkillChange(activity.id, index, 'level', parseInt(e.target.value))
                    }
                    className="border border-gray-300 px-3 py-1 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-20 text-center"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    min="1"
                    max="5"
                  />
                  <button
                    onClick={() => deleteSkill(activity.id, index)}
                    className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                        transition: 'background-color 0.1s', // Smooth transition for hover effect
                      }}
                  >Delete
                  </button>
                </li>
              ))}
            </ul>
            {activity.fileUrl && (
              <div className="-mt-2">
                <h4 className="text-lg font-semibold text-gray-900 mb-2"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                  }}
                >Certificate File:</h4>
                <a
                  href={activity.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-800 underline"
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                >View File
                </a>
              </div>
            )}
            <div className="flex mt-1 justify-end gap-4">
              <button
                onClick={() => addSkill(activity.id)}
                className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                    transition: 'background-color 0.1s', // Smooth transition for hover effect
                  }}
              >Add Skill
              </button>
              <button
                onClick={() => approveActivity(activity.id)}
                className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                    transition: 'background-color 0.1s', // Smooth transition for hover effect
                  }}
              >Approve
              </button>
            </div>
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-2"
                style={{
                  fontFamily: '"Times New Roman", Times, serif',
                }}
              >Submitted by:</h4>
              <p className="text-gray-700"
                style={{
                  fontFamily: '"Times New Roman", Times, serif',
                }}
              >
                {activity.firstname} {activity.lastname} ({activity.studentId})
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PendingActivitiesPage;
