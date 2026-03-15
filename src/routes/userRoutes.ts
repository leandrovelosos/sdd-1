import { Router, Request, Response, NextFunction } from 'express'
import type { UserService } from '../types/index'

export function createUserRouter(userService: UserService): Router {
  const router = Router()

  // POST /users — 6.2
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.createUser(req.body)
      res.status(201).json(user)
    } catch (err) {
      next(err)
    }
  })

  // GET /users — 6.3
  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.listUsers()
      res.status(200).json(users)
    } catch (err) {
      next(err)
    }
  })

  // GET /users/:id — 6.4
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id)
      const user = await userService.getUserById(id)
      res.status(200).json(user)
    } catch (err) {
      next(err)
    }
  })

  // PUT /users/:id — 6.5
  router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id)
      await userService.updateUser(id, req.body)
      res.status(200).json({ message: 'User updated successfully' })
    } catch (err) {
      next(err)
    }
  })

  // DELETE /users/:id — 6.6
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id)
      await userService.deleteUser(id)
      res.status(200).json({ message: 'User deleted successfully' })
    } catch (err) {
      next(err)
    }
  })

  return router
}
