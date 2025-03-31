import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { collection, addDoc, getDocs, DocumentData, QuerySnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { db, storage } from '../firestore/firebase';
import RadarChart from './RadarChart';
import Link from 'next/link';
import { CmuOAuthBasicInfo } from '../types/CmuOAuthBasicInfo';
import { useRouter } from 'next/router';

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

interface User {
  firstname_EN: string;
  lastname_EN: string;
}

const ProfilePage: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activityData, setActivityData] = useState<{
    name: string;
    description: string;
    skills: Skill[];
    file: File | null;
  }>({
    name: '',
    description: '',
    skills: [],
    file: null,
  });

  const [submittedActivities, setSubmittedActivities] = useState<Activity[]>([]);
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [userData, setUserData] = useState<CmuOAuthBasicInfo | null>(null);
  const router = useRouter();
  const imagesListRef = ref(storage, 'images/');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  // const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState('/default-profile.png');
  const [errorMessage, setErrorMessage] = useState('');
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
  axios.get<User>('/api/whoAmI')
    .then((response) => {
      if (response.data) {
        setUserData(response.data as CmuOAuthBasicInfo); // Casting the type
      }
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
  });

  listAll(imagesListRef).then((response) => {
    response.items.forEach((item) => {
      getDownloadURL(item).then((url) => {
        setImageUrls((prev) => [...prev, url]);
      });
    });
  });

  const fetchActivities = async () => {
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, 'PendingActivities'));
    const activities: Activity[] = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];

    const filteredActivities = activities.filter(activity => activity.userId === userData?.cmuitaccount);

    setSubmittedActivities(filteredActivities);
  };

  fetchActivities();
}, [userData?.cmuitaccount]);

useEffect(() => {
  const loadProfileImage = async () => {
    if (userData) {
      const userDocRef = doc(db, 'users', userData.cmuitaccount); // Use user's ID to reference the document
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setProfileImageUrl(docSnap.data().profileImageUrl || '/default-profile.png');
      }
    }
  };
  loadProfileImage();
}, [userData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActivityData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setActivityData((prevData) => ({
      ...prevData,
      file: file,
    }));
  };

  const handleSkillChange = (index: number, field: keyof Skill, value: string) => {
    const updatedSkills = [...activityData.skills];
    const skill = updatedSkills[index] as Skill;

    if (field === 'level') {
      skill.level = parseInt(value);
    } else {
      skill.name = value;
    }
    setActivityData((prevData) => ({
      ...prevData,
      skills: updatedSkills,
    }));
  };

  const addSkill = () => {
    setActivityData((prevData) => ({
      ...prevData,
      skills: [...prevData.skills, { name: '', level: 1 }],
    }));
  };

  const removeSkill = (index: number) => {
    const updatedSkills = [...activityData.skills];
    updatedSkills.splice(index, 1);
    setActivityData((prevData) => ({
      ...prevData,
      skills: updatedSkills,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { name, description, skills, file } = activityData;

    // Validation: Check if the required fields are filled and at least one skill is selected
    if (!name || !description || skills.length === 0) {
      setErrorMessage('Please select at least one skill.'); 
      return; // Stop further execution if validation fails
    }

    const newActivity: Omit<Activity, 'id' | 'fileUrl'> = {
      name,
      description,
      skills,
      status: 'pending',
      createdAt: new Date(),
      userId: userData?.cmuitaccount || '',
      firstname: userData?.firstname_EN || '',
      lastname: userData?.lastname_EN || '',
      studentId: userData?.student_id || '',
    };


    try {
      let fileUrl: string | null = null;
      if (file) {
        const fileRef = ref(storage, `certificates/${file.name}`);
        const uploadResult = await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(uploadResult.ref);
      }

      const docRef = await addDoc(collection(db, 'PendingActivities'), {
        ...newActivity,
        fileUrl: fileUrl || null,
      });

      console.log('Activity added to Firestore with ID: ', docRef.id);

      setSubmittedActivities((prevActivities) => [
        ...prevActivities,
        { ...newActivity, id: docRef.id, fileUrl: fileUrl ?? null },
      ]);

      setShowModal(false);

      setActivityData({
        name: '',
        description: '',
        skills: [],
        file: null,
      });
    } catch (error) {
      console.error('Error adding activity: ', error);
    }
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setProfileImage(file);

      // Create a reference for the file in Firebase Storage
      const imageRef = ref(storage, `profileImages/${file.name}`);

      // Upload the file
      try {
        const uploadResult = await uploadBytes(imageRef, file);
        // Get the download URL
        const url = await getDownloadURL(uploadResult.ref);
        setProfileImageUrl(url);

        // Save the URL to Firestore
        if (userData) {
          const userDocRef = doc(db, 'users', userData.cmuitaccount);
          await setDoc(userDocRef, { profileImageUrl: url }, { merge: true });
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const saveImageUrlToDatabase = async (url: any) => {
    try {
      const userDocRef = doc(db, 'users', 'USER_ID'); 
      await setDoc(userDocRef, { profileImageUrl: url }, { merge: true });
    } catch (error) {
      console.error('Error saving image URL to database:', error);
    }
  };

  const fetchProfileImageUrl = async () => {
    try {
      const userDocRef = doc(db, 'users', 'USER_ID'); 
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        return docSnap.data().profileImageUrl || '/default-profile.png';
      }
    } catch (error) {
      console.error('Error fetching image URL from database:', error);
    }
    return '/default-profile.png';
  };

  useEffect(() => {
    const loadProfileImage = async () => {
      const url = await fetchProfileImageUrl();
      setProfileImageUrl(url);
    };
    loadProfileImage();
  }, []);
  

  const predefinedSkills: string[] = [
    'Teamwork',
    'Adaptability to Technological Changes',
    'Interdisciplinary Collaboration',
    'Effective Communication',
    'Entrepreneurial Mindset',
    'Innovation Mindset',
  ];

  const getStatusClass = (status: 'pending' | 'approved') => {
    switch (status) {
      case 'approved':
        return 'text-green-500';
      case 'pending':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const pendingActivities = submittedActivities.filter(activity => activity.status === 'pending');
  const approvedActivities = submittedActivities.filter(activity => activity.status === 'approved');
  const allSkills = approvedActivities.flatMap(activity => activity.skills);

  return (
    <div className="p-3 bg-gray-100 min-h-screen">
      {/* Navbar */}
      <div className="navbar bg-customColor1 text-primary-content p-4 fixed top-0 left-0 w-full z-50">
        <div className="flex-1">
          <span className="text-xl text-white font-semibold">
          <Link
            href="/student-page"
            className="btn btn-ghost text-xl text-white"
            style={{ fontFamily: '"Times New Roman", Times, serif', fontWeight: 'bold' }}
          >
            {userData ? `${userData.firstname_EN} ${userData.lastname_EN}` : "UserName"}
          </Link>
          </span>
        </div>
        <div className="flex-1">
          <li>
            <Link
              href="/activities"
              className="btn btn-ghost text-xl text-white"
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            >
              Activities Page
            </Link>
          </li>
        </div>
        <div className="flex-1">
          <li>
            <Link
              href="/profile-page"
              className="btn btn-ghost text-xl text-white"
              style={{ fontFamily: '"Times New Roman", Times, serif'}}
            >
              Profile Page
            </Link>
          </li>
        </div>
        <div className="flex-none">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  alt="User"
                  src="/User.png"
                />
              </div>
            </div>
            <ul className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow text-black">
              <li><button onClick={signOut} className="cursor-pointer">Logout</button></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:space-x-8 mt-20">
        <div className="flex flex-col items-center lg:w-1/3 mb-8 lg:mb-0">
          <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="profileImageInput"
            />
            <label htmlFor="profileImageInput" className="cursor-pointer">
              <div className="w-44 h-44 rounded-full border border-gray-300 flex items-center justify-center">
                <img
                  className="w-full h-full rounded-full object-cover"
                  src={profileImageUrl || '/default-profile.png'}
                  alt=""
                />
              </div>
            </label>
            <p className="text-2xl text-blue-800 font-bold mt-3"
              style={{
                fontFamily: '"Times New Roman", Times, serif',
              }}
            >
              {userData ? `${userData.firstname_EN} ${userData.lastname_EN}` : 'User Name'}
            </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: '1.5vw',
                    fontWeight:'bold',
                    transition: 'background-color 0.1s', // Smooth transition for hover effect
                  }}
              >
            Add Activity
          </button>
          <button
                type="button" // Prevents form submission
                onClick={handleViewRubric}
                className="text-white px-4 py-2 rounded-full mt-3"
              style={{
                background: '#00FF66', // Set base background color
                fontSize: '1.5vw',
                fontFamily: '"Times New Roman", Times, serif',
                fontWeight:'bold',
                transition: 'background-color 0.1s', // Smooth transition for hover effect
              }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#33CC66')} // Set hover background color
            onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = '#00FF66')} // Reset background on hover out
        >View Skill Rubric
            </button>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl mb-4 text-blue-900"
          style={{ fontFamily: '"Times New Roman", Times, serif', fontWeight:'bold' }}>Skills Radar Chart</h2>
          <div className="bg-white p-6 rounded-lg shadow-lg border border-blue-300 transition-transform transform hover:scale-105">
            <RadarChart skills={allSkills} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col lg:flex-row lg:space-x-8">
        <div className="lg:w-1/2">
          <h3 className="text-xl mb-2 text-blue-900"
            style={{
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'bold',
            }}
          >Pending Activities</h3>
          {pendingActivities.length > 0 ? (
            <ul>
              {pendingActivities.map((activity) => (
                <li key={activity.id} className="mb-4 p-4 bg-white rounded-lg shadow-md">
                  <h4 className="text-lg font-semibold -mt-2"
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                  >{activity.name}</h4>
                  <p className="text-gray-700"
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                  >{activity.description}</p>
                  <div>
                    <p className="text-sm font-semibold text-blue-800"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    >Skills:</p>
                    <ul className="list-disc ml-6 text-gray-700"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    >
                      {activity.skills.map((skill, index) => (
                        <li key={index}>{skill.name} - Level {skill.level}</li>
                      ))}
                    </ul>
                  </div>
                  {activity.fileUrl && (
                    <div className="mt-2">
                      <a href={activity.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline"
                        style={{
                          fontFamily: '"Times New Roman", Times, serif',
                        }}
                      >View Attached File
                      </a>
                    </div>
                  )}
                  <p className={`mt-2 text-sm ${getStatusClass(activity.status)}`}
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                  >{activity.status}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500"
              style={{
                fontFamily: '"Times New Roman", Times, serif',
              }}
            >No pending activities</p>
          )}
        </div>

        <div className="lg:w-1/2 mt-8 lg:mt-0">
          <h3 className="text-xl mb-2 text-blue-900"
          style={{
            fontFamily: '"Times New Roman", Times, serif',
            fontWeight: 'bold',
          }}
          >Approved Activities</h3>
          {approvedActivities.length > 0 ? (
            <ul>
              {approvedActivities.map((activity) => (
                <li key={activity.id} className="mb-4 p-4 bg-white rounded-lg shadow-md">
                  <h4 className="text-lg font-semibold -mt-2"
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                      fontWeight: 'bold',
                    }}
                  >{activity.name}</h4>
                  <p className="text-gray-700"
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                  >{activity.description}</p>
                  <div>
                    <p className="text-sm font-semibold text-blue-800"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    >Skills:</p>
                    <ul className="list-disc ml-6 text-gray-700"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    >
                      {activity.skills.map((skill, index) => (
                        <li key={index}>{skill.name} - Level {skill.level}</li>
                      ))}
                    </ul>
                  </div>
                  {activity.fileUrl && (
                    <div className="mt-2">
                      <a href={activity.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline"
                        style={{
                          fontFamily: '"Times New Roman", Times, serif',
                        }}
                      >View Attached File
                      </a>
                    </div>
                  )}
                  <p className={`mt-2 text-sm ${getStatusClass(activity.status)}`}
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                  >{activity.status}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500"
              style={{
                fontFamily: '"Times New Roman", Times, serif',
              }}
            >No approved activities</p>
          )}
        </div>
      </div>

      {/* Add Activity Form */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-3xl p-4 shadow-2xl max-w-2xl w-full">
            <h2 className="text-2xl mb-4 text-red-600"
            style={{
              fontFamily: '"Times New Roman", Times, serif',
              fontWeight: 'bold',
            }}
            >Add Activity</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-blue-700" htmlFor="name"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                  }}
                >Activity Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={activityData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-blue-700" htmlFor="description"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                  }}
                >Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={activityData.description}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-1 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-blue-700"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                  }}
                >Skills</label>
                {activityData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <select
                      value={skill.name}
                      onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                      required
                      className="w-2/3 px-3 py-1 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 mr-2"
                        style={{
                          fontFamily: '"Times New Roman", Times, serif',
                        }}
                    >
                      <option value=""
                      >Select a skill</option>
                      {predefinedSkills.map((skillName, idx) => (
                        <option key={idx} value={skillName}>
                          {skillName}
                        </option>
                      ))}
                    </select>
                    <label className="block text-sm font-semibold mb-1 text-blue-700"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    >Level of Skill</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={skill.level}
                      onChange={(e) => handleSkillChange(index, 'level', e.target.value)}
                      required
                      className="w-1/3 px-3 py-1 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 mr-2"
                        style={{
                          fontFamily: '"Times New Roman", Times, serif',
                        }}
                    />
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="text-red-500 underline text-sm"
                        style={{
                          fontFamily: '"Times New Roman", Times, serif',
                        }}
                    >Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSkill}
                  className="text-blue-500 underline text-sm"
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                >Add Skill
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-blue-700" htmlFor="file"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                  }}
                >Attach Certificate File
                </label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  onChange={handleFileChange}
                  className="w-full px-3 py-1 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 underline text-sm mr-3"
                   style={{
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                >Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 text-white text-lg rounded-full px-4 py-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                      transition: 'background-color 0.1s', // Smooth transition for hover effect
                    }}
                >Submit
                </button>
                {errorMessage && (
                    <p className="bg-red-100 text-red-700 border border-red-300 rounded-md p-2 mt-2 text-center font-bold"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    >{errorMessage}
                    </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
