import express, { Router } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Ability, AbilityBuilder } from '@casl/ability'

interface iPermission {
  subject: string,
  actions: Array<string>
}

interface iUser {
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

app.use(cors())

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

const someUser: iUser = {
  name: 'Seu Ze',
  permissions: {
    'order': ['create', 'edit', 'read'],
    'financial': ['create', 'edit'],
  }
}

router.get('/order', (req, res) => {
  const ability = defineAbility(someUser)
  const hasAbility = ability.can('read', 'order')

  if (hasAbility) {
    return res.send("Have access!")
  }

  return res.send("Don't have access!")
})

router.get('/financial', (req, res) => {
  const ability = defineAbility(someUser)
  const hasAbility = ability.can('read', 'financial')

  if (hasAbility) {
    return res.send("Have access!")
  }

  return res.send("Don't have access!")
})

router.get('/course/:id', (req, res) => {
  res.send("Have access details!")
})

router.get('/course/:id/edit', (req, res) => {
  res.send("Have access to edit!")
})

app.use(router)

app.listen(PORT, () => console.log(`Server up at port: ${PORT}`))
