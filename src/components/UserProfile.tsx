import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Edit3, Save, Plus, Trash2 } from "lucide-react";
import Cropper from "react-easy-crop";
import CourseCard from "./CourseCard";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { getDoc } from "firebase/firestore";
import { updateEmail } from "firebase/auth";
interface User {
  id?: string;
  name?: string;
  email?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  avatar?: string;
}

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

const defaultFormData: User = {
  name: "",
  email: "",
  bio: "",
  skills: [],
  interests: [],
  avatar: "",
};

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdate: (user: User) => void;
  addedCourses?: Course[];
}

const UserProfile = ({
  isOpen,
  onClose,
  user,
  onUserUpdate,
  addedCourses = [],
}: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(defaultFormData);
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);

  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const initialSnapshot = useRef<string>(JSON.stringify(defaultFormData));

  // Track Firebase Auth state
useEffect(() => {
  const auth = getAuth();
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setAuthUser(user);

    if (user && !formData.name) {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const userData = snap.data() as User;
        setFormData(userData);
        initialSnapshot.current = JSON.stringify(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        onUserUpdate(userData);
      }
    }
  });
  return () => unsubscribe();
  // 👇 only run when component mounts, not when formData changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // Load user into form
  useEffect(() => {
    if (user) {
      const snapshot: User = {
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        skills: user.skills || [],
        interests: user.interests || [],
        avatar: user.avatar || "",
      };
      setFormData(snapshot);
      initialSnapshot.current = JSON.stringify(snapshot);
    } else {
      setFormData(defaultFormData);
      initialSnapshot.current = JSON.stringify(defaultFormData);
    }
  }, [user]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== initialSnapshot.current,
    [formData]
  );

  const handleClose = () => {
    if (isEditing && isDirty) {
      if (!confirm("You have unsaved changes. Discard them?")) return;
    }
    setIsEditing(false);
    onClose();
  };


const handleSave = async () => {
  setError(null);

  if (!formData.name?.trim()) {
    setError("Name is required");
    return;
  }
  if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
    setError("Enter a valid email");
    return;
  }

  if (!authUser) {
    setError("You must be logged in to save your profile.");
    return;
  }

  try {
    // Update Firebase Auth email (important!)
    if (authUser.email !== formData.email) {
      await updateEmail(authUser, formData.email);
    }

    // Save profile to Firestore
    const updatedUser: User = { ...formData, id: authUser.uid };
    const userRef = doc(db, "users", authUser.uid);
    await setDoc(userRef, updatedUser, { merge: true });

    localStorage.setItem("user", JSON.stringify(updatedUser));
    onUserUpdate(updatedUser);

    setIsEditing(false);
    initialSnapshot.current = JSON.stringify(formData);
    setSavedMsg("Profile saved successfully");
    setTimeout(() => setSavedMsg(""), 3000);
  } catch (err: any) {
    console.error(err);
    setError(err.message || "Failed to save profile. Please try again.");
  }
};

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        skills: user.skills || [],
        interests: user.interests || [],
        avatar: user.avatar || "",
      });
    } else {
      setFormData(defaultFormData);
    }
    setIsEditing(false);
    setError(null);
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    const exists = (formData.skills || []).some(
      (sk) => sk.toLowerCase() === s.toLowerCase()
    );
    if (!exists) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), s],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((s) => s !== skill),
    }));
  };

  const addInterest = () => {
    const i = newInterest.trim();
    if (!i) return;
    const exists = (formData.interests || []).some(
      (it) => it.toLowerCase() === i.toLowerCase()
    );
    if (!exists) {
      setFormData((prev) => ({
        ...prev,
        interests: [...(prev.interests || []), i],
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests?.filter((x) => x !== interest),
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImg = (imageSrc: string, cropArea: any): Promise<string> => {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        ctx.drawImage(
          image,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height
        );

        resolve(canvas.toDataURL("image/jpeg"));
      };
    });
  };

  const handleCropComplete = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
    setFormData((prev) => ({ ...prev, avatar: croppedImage }));
    setShowCropper(false);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative glass-effect p-8 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto bounce-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Profile</h2>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="bg-surface border-border"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleSave} size="sm" className="hero-button">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="bg-surface border-border"
                >
                  Cancel
                </Button>
              </div>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-2xl">
                {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            )}
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={!isEditing}
                className="bg-surface border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                disabled={!isEditing}
                className="bg-surface border-border"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-foreground">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              disabled={!isEditing}
              className="bg-surface border-border min-h-[100px]"
              placeholder="Tell others about yourself and your learning journey..."
            />
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <Label className="text-foreground">Skills I Can Teach</Label>
            <div className="flex flex-wrap gap-2">
              {formData.skills?.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-1 bg-accent/20 text-accent px-3 py-1 rounded-full text-sm"
                >
                  <span>{skill}</span>
                  {isEditing && (
                    <button
                      onClick={() => removeSkill(skill)}
                      className="hover:text-accent-glow"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <div className="flex space-x-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  className="bg-surface border-border"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button
                  onClick={addSkill}
                  size="sm"
                  variant="outline"
                  className="bg-surface border-border"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <Label className="text-foreground">Skills I Want to Learn</Label>
            <div className="flex flex-wrap gap-2">
              {formData.interests?.map((interest, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-1 bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm"
                >
                  <span>{interest}</span>
                  {isEditing && (
                    <button
                      onClick={() => removeInterest(interest)}
                      className="hover:text-secondary-glow"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <div className="flex space-x-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add an interest..."
                  className="bg-surface border-border"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                />
                <Button
                  onClick={addInterest}
                  size="sm"
                  variant="outline"
                  className="bg-surface border-border"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {savedMsg && <p className="text-sm text-green-500">{savedMsg}</p>}

          {/* Added Courses */}
          {addedCourses.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Added Courses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          )}

          {addedCourses.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              You haven't added any courses yet.
            </p>
          )}
        </div>
      </div>

      {/* Cropper Modal */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
          <div className="relative w-[90%] h-[70%] bg-white rounded-xl overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedAreaPixels) =>
                setCroppedAreaPixels(croppedAreaPixels)
              }
            />
          </div>
          <div className="flex space-x-4 mt-4">
            <Button onClick={() => setShowCropper(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleCropComplete} className="hero-button">
              Crop & Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
