import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  orderBy,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MyLearning = () => {
  const [user, setUser] = useState<any>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate();

  // Load user
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
          } else {
            const basicUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || "",
            };
            setUser(basicUser);
          }
        } catch (err) {
          console.error("Error loading user:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Load my learning courses from Firestore
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "myLearning"),
      where("userId", "==", user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const courses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMyCourses(courses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load chat messages when chat is opened
  useEffect(() => {
    if (!selectedChat?.chatRoomId) return;

    const q = query(
      collection(db, "messages"),
      where("chatRoomId", "==", selectedChat.chatRoomId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user?.id) return;

    try {
      await addDoc(collection(db, "messages"), {
        chatRoomId: selectedChat.chatRoomId,
        senderId: user.id,
        senderName: user.name,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  const openChat = (course: any) => {
    setSelectedChat(course);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (myCourses.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-surface/50 backdrop-blur-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Button onClick={() => navigate("/home")} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <p className="text-muted-foreground text-lg">
            You haven't started any courses yet.
          </p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/home")} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-foreground">My Learning</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCourses.map((course) => (
            <div
              key={course.id}
              className="bg-gradient-to-br from-surface to-surface-elevated rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
            >
              {/* Course Info */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {course.courseData?.title || "Course"}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {course.courseData?.description}
                </p>
                
                {/* Partner Info */}
                <div className="bg-accent/10 rounded-lg p-3 border border-accent/20 mb-3">
                  <p className="text-xs font-medium text-accent mb-1">Learning Partner:</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
                      {course.partnerUserName?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {course.partnerUserName}
                    </span>
                  </div>
                </div>

                {/* Course Details */}
                <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                  {course.courseData?.duration && (
                    <span>📅 {course.courseData.duration}</span>
                  )}
                  {course.courseData?.level && (
                    <span>📊 {course.courseData.level}</span>
                  )}
                </div>
              </div>

              {/* Chat Button */}
              <Button
                onClick={() => openChat(course)}
                className="w-full bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Open Chat
              </Button>
            </div>
          ))}
        </div>
      </main>

      {/* Chat Modal */}
      <Dialog open={!!selectedChat} onOpenChange={() => setSelectedChat(null)}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">
                  {selectedChat?.courseData?.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Chat with {selectedChat?.partnerUserName}
                </p>
              </div>
              <Button
                onClick={() => setSelectedChat(null)}
                variant="ghost"
                size="sm"
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderId === user?.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-4 ${
                      msg.senderId === user?.id
                        ? "bg-gradient-to-r from-primary to-accent text-white"
                        : "bg-surface border border-border"
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-80">
                      {msg.senderName}
                    </p>
                    <p className="text-sm break-words">{msg.message}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {msg.createdAt?.toDate?.()?.toLocaleTimeString() || "Sending..."}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border bg-surface/50">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 bg-surface border-border"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-primary to-accent text-white"
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send • Share links, resources, and schedule meetings
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyLearning;