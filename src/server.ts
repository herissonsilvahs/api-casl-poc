import express, { NextFunction, Request, Response, Router } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Ability, AbilityBuilder } from '@casl/ability'
import { decode, sign, verify } from 'jsonwebtoken'

interface iPermission {
  subject: string,
  actions: Array<string>
}

interface iUser {
  id: number,
  name: string,
  permissions: Record<string, Array<string>>
}

const defineAbility = (user: iUser) => {
  const { can, cannot, build } = new AbilityBuilder(Ability)

  if (Object.keys(user.permissions).length === 0) {
    return build();
  }

  for (const permission of Object.keys(user.permissions)) {
    for (const action of user.permissions[permission]) {
      can(action, permission)
    }
  }

  return build()
}


const router = Router()

dotenv.config({
  debug: !process.env.PRODUCTION
})

const PORT = process.env.PORT || 3000

const app = express()

app.use((req, res, next) => {
  if (req.headers.authorization) {
    const payload = verify(req.headers.authorization, process.env.JWT_SECRET || '')
    req.sender = payload;
  }
  next()
})

app.use(cors())

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

const someUser: iUser = {
  id: 1,
  name: 'Seu Ze',
  permissions: {
    'order': ['create', 'edit', 'read'],
    'financial': ['create', 'edit'],
  }
}

const checkAbility = (action: string, subject: string) => {
  return (req: Request, res: Response, next: NextFunction,) => {
    const ability = defineAbility(req.sender)
    const hasAbility = ability.can(action, subject)
    if (hasAbility) return next()
    return res.status(403).send('Access not allowed')
  }
}

router.get('/token', (req, res) => {
  const token: string = sign(someUser, process.env.JWT_SECRET || '', {
    expiresIn: '24h',
  });
  return res.send(token)
})

router.get('/order', checkAbility('create', 'order'), (req, res) => {
  return res.send('Have access!')
})

router.get('/financial', checkAbility('read', 'financial'), (req, res) => {
  return res.send('Have access!')
})

router.get('/course/:id', (req, res) => {
  return res.send('Have access details!')
})

router.get('/course/:id/edit', (req, res) => {
  return res.send('Have access to edit!')
})

app.use(router)

app.listen(PORT, () => console.log(`Server up at port: ${PORT}`))
