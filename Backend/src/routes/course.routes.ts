import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate';
import { addCourseSchema, courseIdSchema, updateCourseSchema } from '../validators/course.validator';

const router = Router();

router.use(protect);

router.get('/', CourseController.getCourses);
router.post('/', validateRequest(addCourseSchema), CourseController.addCourse);
router.patch('/:id', validateRequest(updateCourseSchema), CourseController.updateCourse);
router.delete('/:id', validateRequest(courseIdSchema), CourseController.deleteCourse);

export default router;
