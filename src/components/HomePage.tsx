import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, User, Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import CourseCard from "./CourseCard";
import UserProfile from "./UserProfile";
import { db } from "@/firebase";
import { serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Course {
  id: string;
  title: string;
  wantedSkill: string;
  description: string;
  duration: string;
  level: string;
  rating: number;
  teacher: string;
  createdBy: string;
}

const HomePage = () => {
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const [newCourse, setNewCourse] = useState({
    title: "",
    wantedSkill: "",
    description: "",
    duration: "",
    level: "",
    rating: "",
    teacher: "",
  });

  // Load user
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (!parsed.name) setShowProfile(true);
    }
  }, []);

  // Load courses safely from Firebase
  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("title"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const courseList: Course[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "Untitled Course",
          wantedSkill: data.wantedSkill || "",
          description: data.description || "",
          duration: data.duration || "",
          level: data.level || "",
          rating: typeof data.rating === "number" ? data.rating : 0,
          teacher: data.teacher || "Anonymous",
          createdBy: data.createdBy || "Anonymous",
        };
      });
      setCourses(courseList);
    });
    return () => unsubscribe();
  }, []);

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.description) return;

    await addDoc(collection(db, "courses"), {
      title: newCourse.title,
      teacher: newCourse.teacher || "Anonymous",
      wantedSkill: newCourse.wantedSkill,
      description: newCourse.description,
      duration: newCourse.duration,
      level: newCourse.level,
      rating: parseFloat(newCourse.rating) || 0,
      createdBy: user?.name || "Anonymous",
      createdAt: serverTimestamp(),
    });

    setNewCourse({
      title: "",
      teacher: "",
      wantedSkill: "",
      description: "",
      duration: "",
      level: "",
      rating: "",
    });
    setShowAddModal(false);
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.wantedSkill.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              KnowledgeX
            </span>
          </div>

          <div className="flex items-center space-x-4">
  <div className="relative hidden md:block">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Search courses, skills..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10 w-64 bg-surface border-border"
    />
  </div>

  {/* My Learning Button */}
  <Button
    onClick={() => navigate("/my-learning")}
    className="bg-primary text-white border-none"
  >
    My Learning
  </Button>

  <Button
    onClick={() => setShowProfile(true)}
    className="flex items-center space-x-2 bg-surface hover:bg-surface-elevated border border-border p-1 rounded-full"
    variant="outline"
  >
    {user?.avatar ? (
      <img
        src={user.avatar}
        alt="Profile"
        className="h-12 w-12 rounded-full object-cover"
      />
    ) : (
      <User className="h-12 w-12" />
    )}
    <span className="hidden sm:inline text-lg font-medium">{user?.name || "Complete Profile"}</span>
  </Button>
</div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name || "Learner"}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover amazing knowledge exchange opportunities
          </p>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses, skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-surface border-border"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" className="bg-surface border-border">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <p className="text-muted-foreground">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <div
              key={course.id}
              className="slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CourseCard course={course} />
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No courses found matching your search.
            </p>
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <Button
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
        onClick={() => setShowAddModal(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Course Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Course name"
              value={newCourse.title}
              onChange={(e) =>
                setNewCourse({ ...newCourse, title: e.target.value })
              }
            />
            <Input
              placeholder="What skill do you need?"
              value={newCourse.wantedSkill}
              onChange={(e) =>
                setNewCourse({ ...newCourse, wantedSkill: e.target.value })
              }
            />
            <Textarea
              placeholder="Description"
              value={newCourse.description}
              onChange={(e) =>
                setNewCourse({ ...newCourse, description: e.target.value })
              }
            />
            <Input
              placeholder="Duration (e.g. 6 weeks)"
              value={newCourse.duration}
              onChange={(e) =>
                setNewCourse({ ...newCourse, duration: e.target.value })
              }
            />
            <Input
              placeholder="Level (Beginner, Intermediate, Advanced)"
              value={newCourse.level}
              onChange={(e) =>
                setNewCourse({ ...newCourse, level: e.target.value })
              }
            />
            <Input
              placeholder="Teacher name"
              value={newCourse.teacher}
              onChange={(e) =>
                setNewCourse({ ...newCourse, teacher: e.target.value })
              }
            />
            <Input
              placeholder="Rating (0-5)"
              type="number"
              value={newCourse.rating}
              onChange={(e) =>
                setNewCourse({ ...newCourse, rating: e.target.value })
              }
            />
            <Button className="w-full" onClick={handleAddCourse}>
              Add Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
     <UserProfile
  isOpen={showProfile}
  onClose={() => setShowProfile(false)}
  user={user}
  onUserUpdate={handleUserUpdate}
  addedCourses={courses.filter(course => course.createdBy === user?.name)} // 🔹 pass user's courses
/>
    </div>
  );
};

export default HomePage;
