import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, User, Search, Filter, Plus, Bell, Clock, UserCircle, Star, Mail, Award, Target, BookMarked } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import UserProfile from "./UserProfile";

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
const EnhancedCourseCard = ({ course, currentUserId, onStartExchange, onViewProfile }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const isOwner = currentUserId === course.createdById;

  return (
    <div
      className="relative group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge for skill level */}
      <div className="absolute top-4 right-4 z-10">
        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200">
          {course.level || "All Levels"}
        </Badge>
      </div>

      {/* Course Header */}
      <div className="mb-4 relative z-10">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        {/* Clickable Teacher Name - ANYONE can click */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(course.createdById);
            }}
            className="flex items-center gap-2 text-sm hover:bg-indigo-50 rounded-lg px-2 py-1 -ml-2 transition-all group/teacher cursor-pointer z-20 relative"
            type="button"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold transition-transform group-hover/teacher:scale-110">
              {course.teacher?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span className="text-gray-600 group-hover/teacher:text-indigo-600 group-hover/teacher:underline font-medium transition-colors">
              {course.teacher}
            </span>
          </button>
        </div>
      </div>

      {/* Wanted Skill */}
      {course.wantedSkill && (
        <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 relative z-10">
          <p className="text-xs font-medium text-emerald-700 mb-1">Looking to learn:</p>
          <p className="text-sm font-semibold text-emerald-600">{course.wantedSkill}</p>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3 relative z-10">
        {course.description}
      </p>

      {/* Course Details */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 relative z-10">
        {course.duration && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{course.duration}</span>
          </div>
        )}
        {course.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span>{course.rating}</span>
          </div>
        )}
      </div>

      {/* Hover Button - Only show if not owner */}
      {isHovered && !isOwner && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl flex items-end justify-center pb-6 animate-in fade-in duration-200 pointer-events-none">
          <Button
            onClick={() => onStartExchange(course)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 pointer-events-auto"
          >
            Start Exchange
          </Button>
        </div>
      )}
    </div>
  );
};

// User Profile View Modal - Shows other users' profiles (read-only)
const UserProfileView = ({ isOpen, onClose, userId }: any) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userCourses, setUserCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!isOpen || !userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Fetch user profile by ID
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserProfile({ id: userSnap.id, ...userSnap.data() });
          
          // Fetch courses created by this user
          const coursesQuery = query(
            collection(db, "courses"),
            where("createdById", "==", userId)
          );
          const coursesSnap = await getDocs(coursesQuery);
          const coursesList = coursesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Course));
          setUserCourses(coursesList);
        } else {
          setUserProfile(null);
          setUserCourses([]);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setUserProfile(null);
        setUserCourses([]);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UserCircle className="h-7 w-7 text-indigo-600" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading profile...</p>
          </div>
        ) : userProfile ? (
          <div className="space-y-6 pt-2">
            {/* Avatar & Name Section */}
            <div className="flex items-center gap-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-100">
              {userProfile.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                  {userProfile.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {userProfile.name}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-500" />
                  {userProfile.email}
                </p>
              </div>
            </div>

            {/* Bio Section */}
            {userProfile.bio && (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-indigo-600" />
                  About
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {userProfile.bio}
                </p>
              </div>
            )}

            {/* Skills Section */}
            {userProfile.skills && userProfile.skills.length > 0 && (
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-emerald-600" />
                  Can Teach
                </h4>
                <div className="flex flex-wrap gap-2">
                  {userProfile.skills.map((skill: string, idx: number) => (
                    <Badge
                      key={idx}
                      className="bg-emerald-100 text-emerald-700 border-emerald-300 px-4 py-2 text-sm font-medium hover:bg-emerald-200 transition-colors"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Interests Section */}
            {userProfile.interests && userProfile.interests.length > 0 && (
              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-amber-600" />
                  Wants to Learn
                </h4>
                <div className="flex flex-wrap gap-2">
                  {userProfile.interests.map((interest: string, idx: number) => (
                    <Badge
                      key={idx}
                      className="bg-amber-100 text-amber-700 border-amber-300 px-4 py-2 text-sm font-medium hover:bg-amber-200 transition-colors"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Courses Created by This User */}
            {userCourses.length > 0 && (
              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  <BookMarked className="h-5 w-5 text-indigo-600" />
                  Courses Offered ({userCourses.length})
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {userCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">
                          {course.title}
                        </h5>
                        {course.level && (
                          <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200 text-xs">
                            {course.level}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {course.description}
                      </p>
                      {course.wantedSkill && (
                        <div className="bg-emerald-50 rounded px-3 py-1 inline-block">
                          <p className="text-xs text-emerald-700 font-medium">
                            Looking for: {course.wantedSkill}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!userProfile.bio &&
              (!userProfile.skills || userProfile.skills.length === 0) &&
              (!userProfile.interests || userProfile.interests.length === 0) &&
              userCourses.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
                  <UserCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    This user hasn't filled out their profile yet.
                  </p>
                </div>
              )}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
            <UserCircle className="h-20 w-20 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              User profile not found
            </p>
          </div>
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
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = { id: firebaseUser.uid, ...userDoc.data() };
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } else {
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

  // Load courses from Firebase
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

  if (!user) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-600">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-lg sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              KnowledgeX
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-white border-gray-300"
              />
            </div>

            {/* Requests Button */}
            <Button
              onClick={() => navigate("/requests")}
              className="relative bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-none hover:shadow-lg transition-all"
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
              className="bg-indigo-600 text-white border-none hover:bg-indigo-700"
            >
              My Learning
            </Button>

            <Button
              onClick={() => setShowProfile(true)}
              className="flex items-center space-x-2 bg-white hover:bg-gray-50 border border-gray-300 p-1 rounded-full"
              variant="outline"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || <User className="h-6 w-6" />}
                </div>
              )}
              <span className="hidden sm:inline text-lg font-medium pr-3 text-gray-700">
                {user?.name || "Complete Profile"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || "Learner"}!
          </h1>
          <p className="text-gray-600 text-lg">
            Discover amazing knowledge exchange opportunities
          </p>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses, skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-300"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" className="bg-white border-gray-300">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <p className="text-gray-600">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <div
              key={course.id}
              className="animate-in fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <EnhancedCourseCard
                course={course}
                currentUserId={user?.id}
                onStartExchange={handleStartExchange}
                onViewProfile={(userId: string) => setViewProfileUser(userId)}
              />
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No courses found matching your search.
            </p>
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <Button
        className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-xl transition-all hover:scale-110"
        onClick={() => setShowAddModal(true)}
      >
        <Plus className="h-7 w-7" />
      </Button>

      {/* Add Course Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add a New Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Course name"
              value={newCourse.title}
              onChange={(e) =>
                setNewCourse({ ...newCourse, title: e.target.value })
              }
              className="border-gray-300"
            />
            <Input
              placeholder="What skill do you need?"
              value={newCourse.wantedSkill}
              onChange={(e) =>
                setNewCourse({ ...newCourse, wantedSkill: e.target.value })
              }
              className="border-gray-300"
            />
            <Textarea
              placeholder="Description"
              value={newCourse.description}
              onChange={(e) =>
                setNewCourse({ ...newCourse, description: e.target.value })
              }
              className="border-gray-300"
            />
            <Input
              placeholder="Duration (e.g. 6 weeks)"
              value={newCourse.duration}
              onChange={(e) =>
                setNewCourse({ ...newCourse, duration: e.target.value })
              }
              className="border-gray-300"
            />
            <Input
              placeholder="Level (Beginner, Intermediate, Advanced)"
              value={newCourse.level}
              onChange={(e) =>
                setNewCourse({ ...newCourse, level: e.target.value })
              }
              className="border-gray-300"
            />
            <Input
              placeholder="Rating (0-5)"
              type="number"
              value={newCourse.rating}
              onChange={(e) =>
                setNewCourse({ ...newCourse, rating: e.target.value })
              }
              className="border-gray-300"
            />
            <Button 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white" 
              onClick={handleAddCourse}
            >
              Add Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Send Exchange Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                {selectedCourse?.title}
              </h3>
              <p className="text-sm text-gray-600">
                By {selectedCourse?.teacher}
              </p>
            </div>
            <Textarea
              placeholder="Add a message (optional)..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="min-h-[100px] border-gray-300"
            />
            <Button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              onClick={handleSendRequest}
            >
              Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User's Own Profile Modal (Editable) */}
      <UserProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onUserUpdate={handleUserUpdate}
        addedCourses={courses.filter(course => course.createdById === user?.id)}
      />

      {/* Other User Profile View Modal (Read-only) */}
      <UserProfileView
        isOpen={!!viewProfileUser}
        onClose={() => setViewProfileUser(null)}
        userId={viewProfileUser}
      />
    </div>
  );
};

export default HomePage;