// Run with: npm run seed
// Populates the database with sample users and projects for demo/testing.
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Project from "../models/Project.js";

dotenv.config();

const seed = async () => {
  await connectDB();

  await User.deleteMany({});
  await Project.deleteMany({});

  const users = await User.create([
    {
      name: "Dr. Ayesha Rahman",
      email: "ayesha.rahman@bubt.edu.bd",
      password: "password123",
      role: "faculty",
      department: "Computer Science & Engineering",
      bio: "Faculty member researching NLP and low-resource Bangla language processing.",
      interests: ["natural language processing", "bangla nlp", "machine learning"],
      skills: ["python", "pytorch", "research writing"],
      isAvailableForCollab: true,
      isVerified: true,
    },
    {
      name: "Tanvir Ahmed",
      email: "tanvir.ahmed@bubt.edu.bd",
      password: "password123",
      role: "student",
      department: "Computer Science & Engineering",
      bio: "Final year CSE student interested in computer vision and robotics.",
      interests: ["computer vision", "robotics", "machine learning"],
      skills: ["python", "opencv", "tensorflow"],
      isAvailableForCollab: true,
      isVerified: true,
    },
    {
      name: "Nusrat Jahan",
      email: "nusrat.jahan@bubt.edu.bd",
      password: "password123",
      role: "researcher",
      department: "Pharmacy",
      bio: "Researching drug discovery using computational methods.",
      interests: ["bioinformatics", "drug discovery", "computational biology"],
      skills: ["r", "python", "data analysis"],
      isAvailableForCollab: true,
      isVerified: true,
    },
  ]);

  await Project.create([
    {
      title: "Bangla Sentiment Analysis for Social Media",
      description:
        "Building a sentiment analysis model for Bangla social media text using transformer-based architectures. Looking for collaborators with NLP or data annotation experience.",
      owner: users[0]._id,
      tags: ["natural language processing", "bangla nlp"],
      requiredSkills: ["python", "pytorch"],
      status: "open",
      maxCollaborators: 4,
    },
    {
      title: "Low-cost Object Detection for Campus Security",
      description:
        "Developing a lightweight object detection system deployable on Raspberry Pi for campus security monitoring.",
      owner: users[1]._id,
      tags: ["computer vision", "robotics"],
      requiredSkills: ["python", "opencv"],
      status: "open",
      maxCollaborators: 3,
    },
  ]);

  console.log("Seed data created successfully.");
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
