import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { CmuOAuthBasicInfo } from '../types/CmuOAuthBasicInfo';
import User from '../public/User.png';
import { useRouter } from 'next/router';

function StudentPage() {
  const [userData, setUserData] = useState<CmuOAuthBasicInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
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
    // Fetch user details on component mount
    axios.get<CmuOAuthBasicInfo>('/api/whoAmI')
      .then((response) => {
        if (response.data) {
          setUserData(response.data);
        }
      })
      .catch((error) => {
        if (!error.response) {
          setErrorMessage("Cannot connect to the network. Please try again later.");
        } else if (error.response.status === 401) {
          setErrorMessage("Authentication failed");
        } else {
          setErrorMessage("Unknown error occurred. Please try again later");
        }
      });
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <div className="navbar bg-customColor1 text-primary-content p-4 fixed top-0 left-0 w-full z-50">
        <div className="flex-1"
        style={{ fontFamily: '"Times New Roman", Times, serif', fontWeight: 'bold' }}>
          {/* Display user's full name */}
          <a className="text-xl text-white">
            {userData
              ? `${userData.firstname_EN} ${userData.lastname_EN}`
              : "UserName"}
          </a>
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
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            >
              Profile Page
            </Link>
          </li>
        </div>

        <div className="flex-none gap-2">
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

      {/* Main Content */}
      <div className="flex flex-col h-screen" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
        <div className="flex-1 p-8 flex flex-col items-center justify-start bg-no-repeat bg-cover bg-center bg-fix" style={{ backgroundImage: 'url(/Welcome.png)' }}>
          {/* Welcome Section */}
          <div className="text-center mb-8" style={{ marginTop: '60px', fontFamily: '"Times New Roman", Times, serif' }}>
            <h2 className="text-5xl font-bold text-white mb-2">Welcome to </h2>
            <h1 className="text-8xl font-bold text-white mb-5">TRACKTIVITY</h1>
            <p className="text-lg text-white mt-[-38px]">Track and manage your activities effortlessly</p>
          </div>
        </div>

        {/* Get Started Section */}
        <div className="flex justify-between absolute bottom-1 left-0 right-0 px-16" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
  {/* Get Started Section */}
  <div className="bg-opacity-75 p-6 rounded text-left max-w-md">
    <h2 className="text-2xl font-semibold text-yellow-200 mb-2.5">Get Started with Tracktivity</h2>
    <p className="text-gray-200">
      Tracktivity helps students and administrators manage and track student activities, certificates, and skill development. Streamline the submission process, enable efficient review and approval, visualize skill development, and facilitate activity publicizing.
    </p>
  </div>

  {/* Join Tracktivity Section */}
  <div className="bg-opacity-75 p-6 rounded text-right max-w-md">
    <h2 className="text-2xl font-semibold text-yellow-200 mb-2.5">Join Tracktivity Today</h2>
    <p className="text-gray-200">
      Start tracking and managing your activities now to enhance your skills and get recognized for your achievements.
    </p>
  </div>
</div>

      </div>
    </div>
  );
}


export default StudentPage;
