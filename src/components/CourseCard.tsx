import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Clock, TrendingUp, ArrowLeftRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  teacher: string;
  teacherSkill: string;
  wantedSkill: string;
  description: string;
  level: string;
  duration: string;
  rating: number;
  avatar: string;
  createdBy: string; // ID of the user who added this course
}

interface CourseCardProps {
  course: Course;
  currentUserId: string; // ID of the logged-in user
  onEdit?: (courseId: string) => void;
  onDelete?: (courseId: string) => void;
}

const CourseCard = ({ course, currentUserId, onEdit, onDelete }: CourseCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'text-accent bg-accent/10';
      case 'Intermediate':
        return 'text-secondary bg-secondary/10';
      case 'Advanced':
        return 'text-primary bg-primary/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div
      className="course-card p-6 rounded-xl relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-xl">
            {course.avatar}
          </div>
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">{course.title}</h3>
            <p className="text-sm text-muted-foreground">by {course.teacher}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 text-secondary fill-current" />
          <span className="text-sm text-foreground">{course.rating}</span>
        </div>
      </div>

      {/* Skills Exchange */}
      <div className="mb-4 p-3 bg-surface rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-accent font-medium">Teaches:</span>
            <span className="text-foreground">{course.teacherSkill}</span>
          </div>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center space-x-2">
            <span className="text-secondary font-medium">Wants:</span>
            <span className="text-foreground">{course.wantedSkill}</span>
          </div>
        </div>
      </div>

      {/* Course Info */}
      <div className="mb-4">
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
          {course.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                {course.level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Details */}
      <div className={`absolute inset-0 bg-surface-elevated/95 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 ${
        isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        <div className="h-full flex flex-col justify-center space-y-4">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-foreground mb-2">{course.title}</h4>
            <p className="text-muted-foreground text-sm mb-4">{course.description}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teacher:</span>
              <span className="text-foreground">{course.teacher}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="text-foreground">{course.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Level:</span>
              <span className="text-foreground">{course.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rating:</span>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-secondary fill-current" />
                <span className="text-foreground">{course.rating}</span>
              </div>
            </div>
          </div>

          {/* Conditional Buttons */}
          <div className="pt-4 flex space-x-2">
            {course.createdBy === currentUserId ? (
              <>
                <Button 
                  className="flex-1"
                  variant="outline"
                  onClick={() => onEdit && onEdit(course.id)}
                >
                  Edit
                </Button>
                <Button 
                  className="flex-1"
                  variant="destructive"
                  onClick={() => onDelete && onDelete(course.id)}
                >
                  Delete
                </Button>
              </>
            ) : (
              <Button className="w-full hero-button">
                Start Exchange
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
