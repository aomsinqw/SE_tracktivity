import { NextApiRequest, NextApiResponse } from "next";
import {db} from '@/firestore/firebase'
import { collection, getDocs, onSnapshot } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const Activities = collection(db, 'AdminActivities');
    res.status(200).json(Activities);
  }
}
