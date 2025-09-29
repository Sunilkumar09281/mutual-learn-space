import { useEffect, useState } from "react";
import CourseCard from "./CourseCard";

const MyLearning = () => {
  const [myCourses, setMyCourses] = useState<any[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("myLearning") || "[]");
    setMyCourses(saved);
  }, []);

  if (myCourses.length === 0)
    return <p className="p-6 text-center text-muted-foreground">You haven't started any courses yet.</p>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">My Learning</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default MyLearning;
