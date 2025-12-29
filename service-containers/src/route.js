const router = require('express').Router();
const controller = require('./container.di');

router.post('/containers', controller.create);
router.get('/containers/:id', controller.getById);
router.patch('/containers/:id', controller.update);
router.delete('/containers/:id', controller.remove);

module.exports = router;
