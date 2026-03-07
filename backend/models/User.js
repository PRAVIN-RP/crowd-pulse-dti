import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import bcrypt from 'bcryptjs';

const usersRef = collection(db, 'users');

const User = {
  findOne: async (conditions) => {
    let q = query(usersRef);
    if (conditions.username) {
      q = query(q, where('username', '==', conditions.username));
    }
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docData = snapshot.docs[0].data();
    return {
      _id: snapshot.docs[0].id,
      ...docData,
      comparePassword: async (candidate) => bcrypt.compare(candidate, docData.password)
    };
  },
  findById: async (id) => {
    const docRef = doc(db, 'users', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { _id: snapshot.id, ...snapshot.data() };
  },
  create: async (data) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const newUser = { ...data, password: hashedPassword };
    const docRef = await addDoc(usersRef, newUser);
    return { _id: docRef.id, ...newUser };
  }
};
export default User;
