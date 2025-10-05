import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, X, Check, Clock, ArrowLeft } from "lucide-react";
import { db } from "@/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

const RequestsPage = () => {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("received");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Load requests
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const field = activeTab === "received" ? "recipientId" : "senderId";
      const q = query(
        collection(db, "exchangeRequests"),
        where(field, "==", user.id),
        where("status", "==", "pending")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const reqs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRequests(reqs);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching requests:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error("Error setting up listener:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [user, activeTab]);

  const handleAccept = async (request: any) => {
    try {
      // Update request status
      await updateDoc(doc(db, "exchangeRequests", request.id), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      // Fetch course details
      const courseDoc = await getDoc(doc(db, "courses", request.courseId));
      if (!courseDoc.exists()) {
        alert("Course not found!");
        return;
      }

      const courseData = { id: courseDoc.id, ...courseDoc.data() };

      // Create a unique chat room ID for both users
      const chatRoomId = `${request.courseId}_${request.senderId}_${request.recipientId}`;

      // Add to BOTH users' learning in Firestore
      // 1. Add to recipient's (owner's) learning
      await setDoc(
        doc(db, "myLearning", `${request.recipientId}_${request.courseId}`),
        {
          userId: request.recipientId,
          courseId: request.courseId,
          courseData: courseData,
          partnerUserId: request.senderId,
          partnerUserName: request.senderName,
          chatRoomId: chatRoomId,
          addedAt: serverTimestamp(),
        }
      );

      // 2. Add to sender's learning
      await setDoc(
        doc(db, "myLearning", `${request.senderId}_${request.courseId}`),
        {
          userId: request.senderId,
          courseId: request.courseId,
          courseData: courseData,
          partnerUserId: request.recipientId,
          partnerUserName: request.recipientName,
          chatRoomId: chatRoomId,
          addedAt: serverTimestamp(),
        }
      );

      // Create initial chat room document
      await setDoc(doc(db, "chatRooms", chatRoomId), {
        courseId: request.courseId,
        courseTitle: request.courseTitle,
        participants: [request.senderId, request.recipientId],
        participantNames: {
          [request.senderId]: request.senderName,
          [request.recipientId]: request.recipientName,
        },
        createdAt: serverTimestamp(),
        lastMessage: null,
      });

      alert("Request accepted! Course added to both users' learning.");
    } catch (err) {
      console.error("Error accepting request:", err);
      alert("Failed to accept request. Please try again.");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, "exchangeRequests", requestId));
      alert("Request rejected.");
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert("Failed to reject request. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate("/")} 
              variant="ghost" 
              size="sm"
              className="hover:bg-surface"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Bell className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">Exchange Requests</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 p-1 bg-surface rounded-xl border border-border w-fit">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "received"
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Received ({requests.filter(r => r.recipientId === user?.id).length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "sent"
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sent ({requests.filter(r => r.senderId === user?.id).length})
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-500 text-sm">Error: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading requests...</p>
          </div>
        )}

        {/* Requests List */}
        {!loading && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-16 bg-surface rounded-2xl border border-border">
                <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">
                  {activeTab === "received" ? "No requests received yet" : "No requests sent yet"}
                </p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gradient-to-br from-surface to-surface-elevated rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                          {activeTab === "received"
                            ? request.senderName?.charAt(0)?.toUpperCase()
                            : request.recipientName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">
                            {activeTab === "received" ? request.senderName : request.recipientName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {activeTab === "received" ? "wants to exchange with you" : "waiting for response"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-accent/10 rounded-lg p-4 border border-accent/20 mb-3">
                        <p className="text-sm font-semibold text-foreground mb-1">
                          Course: {request.courseTitle}
                        </p>
                        {request.message && (
                          <p className="text-sm text-muted-foreground italic mt-2">
                            "{request.message}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {request.createdAt?.toDate?.()?.toLocaleDateString() || "Just now"}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {activeTab === "received" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAccept(request)}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          variant="outline"
                          className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {activeTab === "sent" && (
                      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default RequestsPage;