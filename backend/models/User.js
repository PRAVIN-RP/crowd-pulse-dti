import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
    const docSnap = snapshot.docs[0];
    const docData = docSnap.data();
    return {
      _id: docSnap.id,
      ...docData,
      comparePassword: async (candidate) => bcrypt.compare(candidate, docData.password),
      save: async function() {
        const { _id, comparePassword, save, ...data } = this;
        if (data.password && !data.password.startsWith('$2')) {
          const salt = await bcrypt.genSalt(10);
          data.password = await bcrypt.hash(data.password, salt);
        }
        await updateDoc(doc(db, 'users', docSnap.id), data);
      }
    };
  },

  findById: async (id) => {
    const docRef = doc(db, 'users', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const docData = snapshot.data();
    return {
      _id: snapshot.id,
      ...docData,
      save: async function() {
        const { _id, comparePassword, save, ...data } = this;
        if (data.password && !data.password.startsWith('$2')) {
          const salt = await bcrypt.genSalt(10);
          data.password = await bcrypt.hash(data.password, salt);
        }
        await updateDoc(docRef, data);
      }
    };
  },

  find: async (conditions = {}) => {
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(d => {
      const data = d.data();
      // Apply .select('-password') style exclusion
      const { password, ...safeData } = data;
      return { _id: d.id, ...safeData };
    });
  },

  create: async (data) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const newUser = { ...data, password: hashedPassword };
    const docRef = await addDoc(usersRef, newUser);
    return { _id: docRef.id, ...newUser };
  },

  findByIdAndDelete: async (id) => {
    await deleteDoc(doc(db, 'users', id));
  },

  updateRole: async (id, role) => {
    await updateDoc(doc(db, 'users', id), { role });
  },
};

export default User;

