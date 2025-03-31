import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, QueryDocumentSnapshot, DocumentData, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, firestore } from '../firestore/firebase';
import { formatDate } from '../utils/formatDate';
import { skillColors } from '../utils/skillColors';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';


interface User {
  firstname_EN: string;
  lastname_EN: string;
}

interface Skill {
  name: string;
  level: number;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  dates: Date[];
  skills: { name: string; level: number }[];
  imageUrls: string[];
}

const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [userData, setUserData] = useState<User | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [formValues, setFormValues] = useState<Omit<Activity, 'id'> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const router = useRouter();

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
    axios.get<User>('/api/whoAmI')
      .then((response) => {
        if (response.data) {
          setUserData(response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });

    const unsubscribe = onSnapshot(collection(db, 'AdminActivities'), (snapshot) => {
      const activitiesData: Activity[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data() as Omit<Activity, 'id'>
      }));
      setActivities(activitiesData);
    });

    return () => unsubscribe();
  }, []);

  const handleEditClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setFormValues({
      name: activity.name,
      description: activity.description,
      dates: activity.dates,
      skills: activity.skills,
      imageUrls: activity.imageUrls,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    if (formValues) {
      setFormValues({
        ...formValues,
        [field]: e.target.value,
      });
    }
  };

  const handleSkillChange = (index: number, field: string, value: string | number) => {
    if (formValues && formValues.skills) {
      const updatedSkills = [...formValues.skills];
      if (field === 'name') {
        updatedSkills[index].name = value as string;
      } else if (field === 'level') {
        updatedSkills[index].level = Number(value);
      }
      setFormValues({
        ...formValues,
        skills: updatedSkills,
      });
    }
  };

  
  const handleUpdate = async () => {
    if (selectedActivity && formValues) {
      const activityRef = doc(db, 'AdminActivities', selectedActivity.id);
      await updateDoc(activityRef, { ...formValues });
      setSelectedActivity(null);
      setFormValues(null);
    }
  };


  const handleDateChange = (index: number, newDate: string) => {
    if (formValues && formValues.dates) {
      const updatedDates = [...formValues.dates];
      updatedDates[index] = newDate; // Convert the string to a Date object
      setFormValues({
        ...formValues,
        dates: updatedDates, // Update the dates in formValues
      });
    }
  };

  const addDate = () => {
    if (formValues) {
      const newDates = [...formValues.dates, new Date()]; // Adds a new date (current date)
      setFormValues({ ...formValues, dates: newDates });
    }
  };

  const deleteDate = (index: number) => {
    if (formValues) {
      const newDates = formValues.dates.filter((_, i) => i !== index); // Remove the date at the specified index
      setFormValues({ ...formValues, dates: newDates }); // Update the state with the new dates array
    }
  };
  
  
  const addSkill = () => {
    if (formValues) {
      const newSkills = [...formValues.skills, { name: '', level: 0 }]; // Add a new empty skill object with level set to 0
      setFormValues({ ...formValues, skills: newSkills });
    }
  };
  
  const deleteSkill = (index: number) => {
    if (formValues) {
      const newSkills = formValues.skills.filter((_, i) => i !== index); // Remove the skill at the specified index
      setFormValues({ ...formValues, skills: newSkills });
    }
  };  

  // Function to handle the Delete button click and show confirmation modal
  const handleDeleteClick = (activityId: string) => {
      setActivityToDelete(activityId); // store the activity id
      setIsModalOpen(true); // open the modal
  };

  // Function to confirm and delete the activity
  const confirmDelete = async () => {
    try {
      if (activityToDelete) {
        // Ensure the activity is deleted from Firestore (or your database)
        await deleteDoc(doc(db, 'AdminActivities', activityToDelete));
  
        // Update the state to remove the activity from the UI
        setActivities((prevActivities: Activity[]) =>
          prevActivities.filter((activity: { id: string; }) => activity.id !== activityToDelete)
        );
  
        console.log('Activity successfully deleted');
      }
    } catch (error) {
      console.error('Error removing activity: ', error);
    } finally {
      setIsModalOpen(false); // Close the modal
      setActivityToDelete(null); // Clear the activity to delete
    }
  };
  

  // Function to close the modal without deleting
  const cancelDelete = () => {
    setIsModalOpen(false);
    setActivityToDelete(null); // clear the activity to delete
  };
  
  
  const filteredActivities = filter === ''
    ? activities
    : activities.filter(activity => 
        activity.skills.some(skill => skill.name === filter)
      );

  return (
    <div className="flex flex-col h-screen">
      <div style={{ backgroundImage: 'url(/TracktivityBG.png)', backgroundSize: 'cover' }}>
      {/* Navbar */}
      <div className="navbar bg-customColor1 text-primary-content p-4 fixed top-0 left-0 w-full z-50"
      style={{ fontFamily: '"Times New Roman", Times, serif', fontWeight: 'bold' }}>
        <div className="flex-1">
          <Link
            href="/admin-page"
            className="btn btn-ghost text-xl text-white"
          >
            ADMIN DASHBOARD
          </Link>
        </div>
        <div className="flex-1">
          <li>
            <Link
              href="/activities-admin"
              className="btn btn-ghost text-xl text-white"
            >
              Activities Page
            </Link>
          </li>
        </div>
        <div className="flex-1">
          <li>
            <Link
              href="/post-activity"
              className="btn btn-ghost text-xl text-white"
            >
              Post Activities
            </Link>
          </li>
        </div>
        <div className="flex-0">
          <li>
            <Link
              href="/pending-activities"
              className="btn btn-ghost text-xl text-white"
            >
              Students&apos; Pending Activities
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

      <div className="flex mt-20">
        {/* Sidebar on the left */}
        <div className="w-1/4 bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">Filter Activities</h2>
          <div className="space-y-4">
            {Object.keys(skillColors).map(skill => (
              <button 
                key={skill}
                onClick={() => setFilter(skill)} 
                className={`${skillColors[skill]} hover:bg-opacity-75 text-white font-semibold py-2 px-4 rounded-full w-full transition`}
              >
                {skill}
              </button>
            ))}
            <button 
              onClick={() => setFilter('')} 
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-full w-full transition"
            >
              Show All
            </button>
          </div>
        </div>

        {/* Activities list on the right */}
        <div className="w-3/4 pl-6">
      <h2 className="text-3xl font-bold text-white mb-6">Activities</h2>
      {filteredActivities.length === 0 ? (
        <p className="text-gray-300">No activities available.</p>
      ) : (
        <div className="space-y-6">
          {filteredActivities.map(activity => (
            <div key={activity.id} className="bg-white bg-opacity-80 border border-gray-200 shadow-lg rounded-lg p-6 flex flex-col md:flex-row items-start">
              <div className="flex-1 md:mr-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{activity.name}</h3>
                <p className="text-gray-700 mb-3">{activity.description}</p>
                <div className="text-gray-600 mb-4">
                  <strong className="text-gray-800">Dates:</strong>
                  <ul className="list-disc list-inside">
                    {activity.dates && activity.dates.map((date, index) => (
                      <li key={index}>{formatDate(date.toString())}</li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4">
                  <strong className="text-gray-800">Skills:</strong>
                  <ul className="list-disc list-inside text-gray-600">
                    {activity.skills.map((skill, index) => (
                      <li key={index} className="mb-1 flex items-center">
                        <span className={`w-4 h-4 rounded-full ${skillColors[skill.name]} mr-2`}></span>
                        <span className="font-medium">{skill.name}</span> - Level: {skill.level}
                      </li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => handleEditClick(activity)} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded">Edit</button>
                <button onClick={() => handleDeleteClick(activity.id)} className="bg-red-500 text-white font-semibold py-2 px-4 rounded ml-2">Delete</button>
              </div>
              <div className="flex flex-wrap justify-center space-x-4 space-y-4">
                {activity.imageUrls.map((url, index) => (
                  <div key={index} className="relative group w-64 h-64">
                    <img
                      src={url}
                      alt={`Activity Image ${index + 1}`}
                      className="w-full h-full object-cover border border-gray-300 rounded-lg shadow-sm transition-transform transform group-hover:scale-105"
                    />
                  </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this activity? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button onClick={cancelDelete} className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded">Cancel</button>
              <button onClick={confirmDelete} className="bg-red-500 text-white font-semibold py-2 px-4 rounded">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
        {selectedActivity && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full h-auto overflow-y-auto max-h-[80vh] p-4">
              <h2 className="text-2xl font-bold mb-4 text-center">Edit Activity</h2>

              <div className="mb-4">
                <label className="block mb-2 font-semibold">Activity Name</label>
                <input
                  type="text"
                  value={formValues?.name}
                  onChange={(e) => handleChange(e, 'name')}
                  className="border border-gray-300 rounded w-full p-2 focus:ring-2 focus:ring-green-500 transition duration-200"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold">Description</label>
                <textarea
                  value={formValues?.description}
                  onChange={(e) => handleChange(e, 'description')}
                  className="border border-gray-300 rounded w-full p-2 focus:ring-2 focus:ring-green-500 transition duration-200"
                  rows={2}
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold">Dates</label>
                <ul className="list-disc list-inside mb-2">
                  {formValues?.dates.map((date, index) => (
                    <li key={index} className="text-gray-600">{formatDate(date.toString())}</li>
                  ))}
                </ul>
                <button
                  onClick={addDate}
                  className="bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
                >
                  Add Date
                </button>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold">Change the Date Here</label>
                {formValues?.dates.map((date, index) => (
                  <div key={index} className="flex mb-2 items-center">
                    <input
                      type="date"
                      value={formatDate(date.toString())}
                      onChange={(e) => handleDateChange(index, e.target.value)}
                      className="border border-gray-300 rounded w-full p-2 mr-2 focus:ring-2 focus:ring-green-500 transition duration-200"
                    />
                    <button
                      onClick={() => deleteDate(index)} 
                      className="bg-red-500 text-white font-semibold py-1 px-3 rounded hover:bg-red-600 transition duration-200"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold mb-2">Skills</h3>
                {formValues?.skills.map((skill, index) => (
                  <div key={index} className="flex mb-4">
                    <select
                      value={skill.name}
                      onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                      className="border border-gray-300 rounded w-1/2 p-2 mr-2 focus:ring-2 focus:ring-green-500 transition duration-200"
                    >
                      <option value="">Select Skill</option>
                      <option value="Teamwork">Teamwork</option>
                      <option value="Adaptability to Technological Changes">Adaptability to Technological Changes</option>
                      <option value="Interdisciplinary Collaboration">Interdisciplinary Collaboration</option>
                      <option value="Effective Communication">Effective Communication</option>
                      <option value="Entrepreneurial Mindset">Entrepreneurial Mindset</option>
                      <option value="Innovation Mindset">Innovation Mindset</option>
                    </select>
                    <input
                      type="number"
                      value={skill.level}
                      onChange={(e) => handleSkillChange(index, 'level', Number(e.target.value))}
                      min="1"
                      max="5"
                      className="border border-gray-300 rounded w-1/2 p-2 focus:ring-2 focus:ring-green-500 transition duration-200"
                      placeholder="Level (1-5)"
                    />
                    <button
                      onClick={() => deleteSkill(index)}
                      className="bg-red-500 text-white font-semibold py-1 px-3 rounded ml-2 hover:bg-red-600 transition duration-200"
                    >
                      Delete
                    </button>
                  </div>
                ))}

                <button
                  onClick={addSkill}
                  className="bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
                >
                  Add Skill
                </button>


              <div className="flex justify-between mt-4">
                <button
                  onClick={handleUpdate}
                  className="bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-green-600 transition duration-200"
                >
                  Update Activity
                </button>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="bg-red-500 text-white font-semibold py-2 px-4 rounded hover:bg-red-600 transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
      )}

     </div>
  );
};

export default ActivitiesPage;