import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, User, Search, Filter, Plus, Bell, X, Check, Clock, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import CourseCard from "./CourseCard";
import UserProfile from "./UserProfile";
import { db } from "@/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { doc, deleteDoc } from "firebase/firestore";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  updateDoc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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
  createdById?: string;
}

// Enhanced CourseCard Component
const EnhancedCourseCard = ({ course, currentUserId, onStartExchange, onViewProfile, onEdit, onDelete }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const isOwner = currentUserId === course.createdById;

  return (
    <div
      className="relative group bg-gradient-to-br from-surface to-surface-elevated rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge for skill level */}
      <div className="absolute top-4 right-4">
        <Badge className="bg-primary/10 text-primary border-primary/20">
          {course.level || "All Levels"}
        </Badge>
      </div>

      {/* Course Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
          {course.title}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => onViewProfile(course.createdBy)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group/teacher"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
              {course.teacher?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span className="group-hover/teacher:underline">{course.teacher}</span>
          </button>
        </div>
      </div>

      {/* Wanted Skill */}
      {course.wantedSkill && (
        <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
          <p className="text-xs font-medium text-accent mb-1">Looking to learn:</p>
          <p className="text-sm font-semibold text-accent">{course.wantedSkill}</p>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {course.description}
      </p>

      {/* Course Details */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        {course.duration && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{course.duration}</span>
          </div>
        )}
        {course.rating > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span>{course.rating}</span>
          </div>
        )}
      </div>

      {/* Hover Button - Only show if not owner */}
      {isHovered && !isOwner && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl flex items-end justify-center pb-6 animate-in fade-in duration-200">
          <Button
            onClick={() => onStartExchange(course)}
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Start Exchange
          </Button>
        </div>
      )}
    </div>
  );
};

// User Profile View Modal Component
const UserProfileView = ({ isOpen, onClose, userName }: any) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userName) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "users"), where("name", "==", userName));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          setUserProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [isOpen, userName]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-primary" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : userProfile ? (
          <div className="space-y-6">
            {/* Avatar & Name */}
            <div className="flex items-center gap-4">
              {userProfile.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white">
                  {userProfile.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-foreground">{userProfile.name}</h3>
                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
              </div>
            </div>

            {/* Bio */}
            {userProfile.bio && (
              <div className="bg-surface rounded-xl p-4 border border-border">
                <p className="text-sm text-foreground">{userProfile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {userProfile.skills && userProfile.skills.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Can Teach:</h4>
                <div className="flex flex-wrap gap-2">
                  {userProfile.skills.map((skill: string, idx: number) => (
                    <Badge key={idx} className="bg-accent/20 text-accent border-accent/30">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {userProfile.interests && userProfile.interests.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Wants to Learn:</h4>
                <div className="flex flex-wrap gap-2">
                  {userProfile.interests.map((interest: string, idx: number) => (
                    <Badge key={idx} className="bg-secondary/20 text-secondary border-secondary/30">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">User profile not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

const HomePage = () => {
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [viewProfileUser, setViewProfileUser] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const navigate = useNavigate();

  const [newCourse, setNewCourse] = useState({
    title: "",
    wantedSkill: "",
    description: "",
    duration: "",
    level: "",
    rating: "",
  });

  // Load user with Firebase Auth
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user profile exists in Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = { id: firebaseUser.uid, ...userDoc.data() };
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } else {
            // User authenticated but no profile yet
            const basicUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || "",
            };
            setUser(basicUser);
            localStorage.setItem("user", JSON.stringify(basicUser));
            setShowProfile(true);
          }
        } catch (err) {
          console.error("Error loading user:", err);
        }
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
    });

    return () => unsubscribe();
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
          createdById: data.createdById || data.createdBy,
        };
      });
      setCourses(courseList);
    });
    return () => unsubscribe();
  }, []);

  // Count pending requests
  useEffect(() => {
    if (!user?.id) return;

    try {
      const q = query(
        collection(db, "exchangeRequests"),
        where("recipientId", "==", user.id),
        where("status", "==", "pending")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setPendingRequestsCount(snapshot.size);
        },
        (err) => {
          console.error("Error counting requests:", err);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up request counter:", err);
    }
  }, [user]);

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleStartExchange = (course: Course) => {
    setSelectedCourse(course);
    setShowRequestModal(true);
  };

  const handleSendRequest = async () => {
    if (!selectedCourse || !user?.id) return;

    try {
      await addDoc(collection(db, "exchangeRequests"), {
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        senderId: user.id,
        senderName: user.name,
        recipientId: selectedCourse.createdById || selectedCourse.createdBy,
        recipientName: selectedCourse.createdBy,
        message: requestMessage,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setShowRequestModal(false);
      setRequestMessage("");
      setSelectedCourse(null);
      alert("Request sent successfully!");
    } catch (err) {
      console.error("Error sending request:", err);
      alert("Failed to send request. Please try again.");
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.description || !user?.id) return;

    try {
      await addDoc(collection(db, "courses"), {
        title: newCourse.title,
        teacher: user?.name || "Anonymous",
        createdBy: user?.name || "Anonymous",
        createdById: user?.id,
        wantedSkill: newCourse.wantedSkill,
        description: newCourse.description,
        duration: newCourse.duration,
        level: newCourse.level,
        rating: parseFloat(newCourse.rating) || 0,
        createdAt: serverTimestamp(),
      });

      setNewCourse({
        title: "",
        wantedSkill: "",
        description: "",
        duration: "",
        level: "",
        rating: "",
      });
      setShowAddModal(false);
    } catch (err) {
      console.error("Error adding course:", err);
      alert("Failed to add course. Please try again.");
    }
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

            {/* Requests Button */}
            <Button
              onClick={() => navigate("/requests")}
              className="relative bg-gradient-to-r from-accent to-secondary text-white border-none hover:shadow-lg transition-all"
            >
              <Bell className="h-4 w-4 mr-2" />
              Requests
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </Button>

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
              <span className="hidden sm:inline text-lg font-medium pr-3">
                {user?.name || "Complete Profile"}
              </span>
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
              <EnhancedCourseCard
                course={course}
                currentUserId={user?.id}
                onStartExchange={handleStartExchange}
                onViewProfile={(userName: string) => setViewProfileUser(userName)}
                onEdit={(id: string) => {
                  const courseToEdit = courses.find(c => c.id === id);
                  if (courseToEdit) {
                    setNewCourse({
                      title: courseToEdit.title,
                      wantedSkill: courseToEdit.wantedSkill,
                      description: courseToEdit.description,
                      duration: courseToEdit.duration,
                      level: courseToEdit.level,
                      rating: courseToEdit.rating.toString(),
                    });
                    setShowAddModal(true);
                  }
                }}
                onDelete={async (id: string) => {
                  try {
                    const docRef = doc(db, "courses", id);
                    await deleteDoc(docRef);
                    console.log("Course deleted successfully");
                  } catch (err) {
                    console.error("Error deleting course:", err);
                  }
                }}
              />
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
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-primary to-accent hover:shadow-xl transition-all hover:scale-110"
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

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Exchange Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-surface rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-2">
                {selectedCourse?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                By {selectedCourse?.teacher}
              </p>
            </div>
            <Textarea
              placeholder="Add a message (optional)..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              className="w-full bg-gradient-to-r from-primary to-accent"
              onClick={handleSendRequest}
            >
              Send Request
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
        addedCourses={courses.filter(course => course.createdById === user?.id)}
      />

      {/* User Profile View Modal */}
      <UserProfileView
        isOpen={!!viewProfileUser}
        onClose={() => setViewProfileUser(null)}
        userName={viewProfileUser}
      />
    </div>
  );
};

export default HomePage;