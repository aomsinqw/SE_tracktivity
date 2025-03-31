import React, { useState, ChangeEvent, FormEvent } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firestore/firebase';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';

const SKILLS_OPTIONS = [
  'Teamwork',
  'Adaptability to Technological Changes',
  'Interdisciplinary Collaboration',
  'Effective Communication',
  'Entrepreneurial Mindset',
  'Innovation Mindset'
];

const LEVEL_OPTIONS = [1, 2, 3, 4, 5];

interface Activity {
  name: string;
  description: string;
  dates: string[];
  skills: { name: string; level: number }[];
  imageUrls: string[];
}

const PostActivityPage: React.FC = () => {
  const [activity, setActivity] = useState<Activity>({
    name: '',
    description: '',
    dates: [''],
    skills: [],
    imageUrls: [],
  });

  const [files, setFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setActivity({ ...activity, [e.target.name]: e.target.value });
  };

  const handleDateChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const newDates = [...activity.dates];
    newDates[index] = e.target.value;
    setActivity({ ...activity, dates: newDates });
  };

  const addDate = () => {
    setActivity({ ...activity, dates: [...activity.dates, ''] });
  };

  const removeDate = (index: number) => {
    const newDates = activity.dates.filter((_, i) => i !== index);
    setActivity({ ...activity, dates: newDates });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const newFiles = [...files, ...selectedFiles];
      setFiles(newFiles);

      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...newPreviews]);

      const newImageUrls = await uploadFiles(selectedFiles);
      setActivity((prevActivity) => ({
        ...prevActivity,
        imageUrls: [...prevActivity.imageUrls, ...newImageUrls],
      }));
    }
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];
    for (const file of files) {
      const storageRef = ref(storage, `images/${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      imageUrls.push(imageUrl);
    }
    return imageUrls;
  };

  const handleSkillChange = (index: number, e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedSkills = [...activity.skills];
    updatedSkills[index] = { ...updatedSkills[index], [name]: name === 'level' ? Number(value) : value };
    setActivity({ ...activity, skills: updatedSkills });
  };

  const addSkill = () => {
    setActivity({ ...activity, skills: [...activity.skills, { name: '', level: 1 }] });
  };

  const removeSkill = (index: number) => {
    const updatedSkills = activity.skills.filter((_, i) => i !== index);
    setActivity({ ...activity, skills: updatedSkills });
  };

  const removeImage = async (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    const updatedImageUrls = activity.imageUrls.filter((_, i) => i !== index);

    URL.revokeObjectURL(imagePreviews[index]);

    const fileToRemove = files[index];
    const storageRef = ref(storage, `images/${fileToRemove.name}`);
    await deleteObject(storageRef);

    setFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
    setActivity({ ...activity, imageUrls: updatedImageUrls });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'AdminActivities'), activity);
      alert('Activity posted successfully!');

      imagePreviews.forEach(url => URL.revokeObjectURL(url));

      setActivity({
        name: '',
        description: '',
        dates: [''],
        skills: [],
        imageUrls: [],
      });
      setFiles([]);
      setImagePreviews([]);
    } catch (error) {
      console.error('Error posting activity: ', error);
      alert('Failed to post activity. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-opacity-70">
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


        <h2
          className="text-4xl font-bold mb-10 text-center"
          style={{
            marginTop: '100px',
            color: '#ffffff', // Text color is now white
            fontFamily: '"Times New Roman", Times, serif',
            textShadow: `
              0 0 5px #00ffee, 
              0 0 10px #00ffee, 
              0 0 15px #00ffee, 
              0 0 20px #00ffee
            ` // Aura effect
          }}
        >
          Post New Activity
        </h2>

<form onSubmit={handleSubmit} className="space-y-6 mt-[-0px]">
          <div className="flex justify-between">
            <div className="w-1/2 pr-2">
              <div className="p-6 border border-gray-300 rounded-3xl mb-6 bg-gray shadow-md"
              style={{

                boxShadow: `
                  0 0 5px #00ffee, 
                  0 0 10px #00ffee, 
                  0 0 15px #00ffee, 
                  0 0 20px #00ffee
                ` // Aura effect
              }}>
                        <h3
                  className="text-lg font-bold text-white mb-2"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                    marginTop: '-10px', // Adjust this value as needed
                    textShadow: `
                      0 0 5px #00ffee, 
                      0 0 10px #00ffee, 
                      0 0 15px #00ffee, 
                      0 0 20px #00ffee
                    ` // Aura effect
                  }}
                >
                  Activity Name
                </h3>

                <input
                  type="text"
                  name="name"
                  value={activity.name}
                  onChange={handleChange}
                  placeholder="Activity Name"
                  className="border border-gray-300 px-4 py-2 rounded-full w-full"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
              
                  }}
                />
              </div>
              <div className="p-6 border border-gray-300 rounded-3xl mb-6 bg-gray shadow-md"
              style={{

                boxShadow: `
                  0 0 5px #00ffee, 
                  0 0 10px #00ffee, 
                  0 0 15px #00ffee, 
                  0 0 20px #00ffee
                ` // Aura effect
              }}>
              <h4 className="text-lg mb-2 font-bold"
              style={{
                marginTop: '-5px',
                color: '#ffffff', // Text color is now white
                fontFamily: '"Times New Roman", Times, serif',
                textShadow: `
                  0 0 5px #00ffee, 
                  0 0 10px #00ffee, 
                  0 0 15px #00ffee, 
                  0 0 20px #00ffee
                ` // Aura effect
              }}>Activity Description</h4>
                <textarea
                  name="description"
                  value={activity.description}
                  onChange={handleChange}
                  placeholder="Description"
                  className="border border-gray-300 px-4 py-2 rounded-3xl w-full h-32"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
              
                  }}
                />
              </div>
              <div className="p-6 border border-gray-300 rounded-3xl mb-6 bg-gray shadow-md"
              style={{

                boxShadow: `
                  0 0 5px #00ffee, 
                  0 0 10px #00ffee, 
                  0 0 15px #00ffee, 
                  0 0 20px #00ffee
                ` // Aura effect
              }}>
                <h3 className="text-lg mb-2 font-bold"
                style={{
                  marginTop: '1px',
                  color: '#ffffff', // Text color is now white
                  fontFamily: '"Times New Roman", Times, serif',
                  textShadow: `
                    0 0 5px #00ffee, 
                    0 0 10px #00ffee, 
                    0 0 15px #00ffee, 
                    0 0 20px #00ffee
                  ` // Aura effect
                }}>Date</h3>
                {activity.dates.map((date, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => handleDateChange(index, e)}
                      className="border border-gray-300 px-4 py-2 rounded-full w-full"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeDate(index)}
                      className="ml-2 bg-red-500 text-white hover:bg-red-700 rounded-full px-4 py-1 mt-2"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDate}
                  className="text-white px-3 py-1 rounded-full ml-0"
                  style={{
                    background: '#00FF66', // Set base background color
                    fontFamily: '"Times New Roman", Times, serif',
                    transition: 'background-color 0.1s', // Smooth transition for hover effect
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#33CC66')} // Set hover background color
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = '#00FF66')} // Reset background on hover out
                >
                  Add Date
                </button>
              </div>
            </div>

            <div className="w-1/2 pl-2">
              <div className="p-6 border border-gray-300 rounded-3xl mb-6 bg-gray shadow-md"
              style={{

                boxShadow: `
                  0 0 5px #00ffee, 
                  0 0 10px #00ffee, 
                  0 0 15px #00ffee, 
                  0 0 20px #00ffee
                ` // Aura effect
              }}>
                <h3 className="text-lg mb-2 font-bold"
                style={{
                  marginTop: '1px',
                  color: '#ffffff', // Text color is now white
                  fontFamily: '"Times New Roman", Times, serif',
                  textShadow: `
                    0 0 5px #00ffee, 
                    0 0 10px #00ffee, 
                    0 0 15px #00ffee, 
                    0 0 20px #00ffee
                  ` // Aura effect
                }}>Skills</h3>
                {activity.skills.map((skill, index) => (
                  <div key={index} className="mb-4">
                    <select
                      name="name"
                      value={skill.name}
                      onChange={(e) => handleSkillChange(index, e)}
                      className="border border-gray-300 px-4 py-2 rounded-full w-full mb-2"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    >
                      <option value="">Select Skill</option>
                      {SKILLS_OPTIONS.map((option, i) => (
                        <option key={i} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      name="level"
                      value={skill.level}
                      onChange={(e) => handleSkillChange(index, e)}
                      className="border border-gray-300 px-4 py-2 rounded-full w-full"
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    >
                      <option value="">Select Level</option>
                      {LEVEL_OPTIONS.map((level, i) => (
                        <option key={i} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="ml-2 bg-red-500 text-white hover:bg-red-700 rounded-full px-4 py-1 mt-2"
                      style={{
                        marginLeft: '450px',
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    >
                      Remove
                    </button>

                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSkill}
                  className="text-white px-3 py-1 rounded-full ml-2.5"
                  style={{
                    background: '#00FF66', // Set base background color
                    fontFamily: '"Times New Roman", Times, serif',
                    transition: 'background-color 0.1s', // Smooth transition for hover effect
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#33CC66')} // Set hover background color
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = '#00FF66')} // Reset background on hover out
                >
                  Add Skill
                </button>

              </div>

              <div className="p-6 border border-gray-300 rounded-3xl mb-6 bg-gray shadow-md"
              style={{

                boxShadow: `
                  0 0 5px #00ffee, 
                  0 0 10px #00ffee, 
                  0 0 15px #00ffee, 
                  0 0 20px #00ffee
                ` // Aura effect
              }}>
                <h3 className="text-lg mb-4 font-bold"
                style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  marginTop: '-5px', // Adjust this value as needed
                  color: '#ffffff',
                  textShadow: `
                    0 0 5px #00ffee, 
                    0 0 10px #00ffee, 
                    0 0 15px #00ffee, 
                    0 0 20px #00ffee
                  ` // Aura effect
                }}>Upload Activity Image</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  multiple
                  className="border border-gray-300 bg-white px-4 py-1 rounded-full w-full mb-0 text-black focus:outline-none focus:border-blue-500" // Set margin-bottom to 0
                  style={{ fontFamily: '"Times New Roman", Times, serif', marginBottom: '-10px' }} // Change font and add negative margin
                />

                  
                /{'>'}
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative mb-2">
                    <img
                      src={preview}
                      alt={`Preview ${index}`}
                      className="h-32 w-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 py-1 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-center"> {/* Flex container to center the button */}
            <button
              type="submit"
              className="text-white px-4 py-2 rounded-full ml-2. mb-5"
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
              Post Activity
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PostActivityPage;
