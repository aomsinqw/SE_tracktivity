import React from "react";
import Image from "next/image";


export default function IndexPage() {
 return (
   <div style={{
     display: 'flex',
     flexDirection: 'column',
     alignItems: 'center',
     backgroundColor: '#0d1b2a',
     color: '#ffffff',
     fontFamily: 'Arial, sans-serif',
     textAlign: 'center',
     height: '100vh',
     justifyContent: 'space-between',
     backgroundImage: 'url(/Tracktivity.png)',
     backgroundSize: 'cover',
     backgroundPosition: 'center',
     backgroundRepeat: 'no-repeat'
   }}>
     <div style={{ marginTop: '5%' }}>
       <h1 style={{ fontSize: '3rem' }}>TRACKTIVITY</h1>
       <h2 style={{ fontSize: '1.5rem' }}>ACTIVITY RECORDS SYSTEM</h2>
     </div>


     <div style={{
       display: 'flex',
       justifyContent: 'center',
       gap: '1rem',
       marginTop: '2rem'
     }}>
       <a href={process.env.NEXT_PUBLIC_CMU_OAUTH_URL}>
         <button style={{
           backgroundColor: '#ffffff',
           color: '#0d1b2a',
           padding: '1rem 2rem',
           borderRadius: '0.5rem',
           border: 'none',
           cursor: 'pointer',
           fontSize: '1rem',
           fontWeight: 'bold'
         }}>STUDENTS</button>
       </a>
       <a href={process.env.NEXT_PUBLIC_CMU_OAUTH_URL}>
         <button style={{
           backgroundColor: '#ffffff',
           color: '#0d1b2a',
           padding: '1rem 2rem',
           borderRadius: '0.5rem',
           border: 'none',
           cursor: 'pointer',
           fontSize: '1rem',
           fontWeight: 'bold'
         }}>ADMINISTRATORS / FACULTY STAFFS</button>
       </a>
     </div>


         <div>
           <p>ABOUT US</p>
         </div>


         <div style={{ margin: '2rem 0' }}>
            <p style={{
              fontSize: '1rem',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              An activity record system that streamlines the process of tracking and managing activities that occur within CMU&apos;s engineering department.
            </p>
          </div>


     <div style={{
       display: 'flex',
       justifyContent: 'space-between',
       width: '100%',
       backgroundColor: '#084c61',
       padding: '1rem',
       color: '#ffffff',
       fontSize: '0.875rem'
     }}>
       <div style={{ textAlign: 'left', marginLeft: '1rem' }}>
         <p>ชั้น 4 ตึก 30 ปี คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเชียงใหม่</p>
         <p>239 ถนนห้วยแก้ว ตำบลสุเทพ อำเภอเมือง จังหวัดเชียงใหม่ 50200</p>
         <p>Tel: 0-5394-2023, 08-4614-0006 Fax: 0-5394-2072</p>
         <p>cpe.eng.cmu.ac.th</p>
       </div>
       <div style={{ textAlign: 'right', marginRight: '1rem' }}>
         <p>E-SIEHUB</p>
         <p>https://eng.cmu.ac.th/?tag=e-sie-hub</p>
       </div>
     </div>
   </div>
 );
}

