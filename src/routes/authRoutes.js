import express from 'express'
import { createRequire } from 'node:module'
import jwt from 'jsonwebtoken'
import prisma from '../prismaclient.js'

const require = createRequire(import.meta.url)
const bcrypt = require('bcryptjs')

const router = express.Router()

//register a new user endpoint
router.post('/register', async(req,res)=>{
    const {username,password} = req.body
    //the username and password will be saved in the database but the password
    //will be first encrypted and then stored in the database using bcryptjs

    //after user has send username and password 
    //step1- encrypt the password
    const hashedPassword = bcrypt.hashSync(password,8)
    
    //step2- saving new username and hashed password in the database
    try{
        const user = await prisma.user.create({
            data:{
                username,
                password:hashedPassword
            }
        })

            //now that we have user i want to add their first todo for them
            const defaultTodo=`hello :) Add your first todo!`
            await prisma.todo.create({
                data:{
                    task:defaultTodo,
                    userId:user.id
                }
            })

            //create a token
            const token = jwt.sign({id:user.id}, process.env.JWT_SECRET,{expiresIn:'24h'})
            res.json({token})    
    }catch(err){
        console.log(err.message)
        res.sendStatus(503)
    }   
})

router.post('/login',async(req,res)=>{
    //when a user is trying to login , they will put their username and password
    //then we will try to match that uasername and password in the database
    //but we have saved the encrypted password in the database so it will not match
    //so in order to match the password we will encrypt the password that the user just entered
    //and will try to match that encrypted password in the database and if the password entetred is correct the user will be logged in

    const {username,password} = req.body
    try{
        const user = await prisma.user.findUnique({
            where:{
                username:username
            }
        })
        if(!user) {return res.status(404).send({message:"user not found"})}

        const passwordIsvalid = bcrypt.compareSync(password,user.password) //for encrypting the entered password and comparing it to the encrypted password in the database
        //if password does not match return out of the function
        if(!passwordIsvalid) {return res.status(404).send({message:"Invalid passwors"})}

        //then we have a successful authentication
        const token = jwt.sign({id:user.id},process.env.JWT_SECRET,{expiresIn:'24h'})
        res.json({token})
    }catch(err){
        console.log(err.message)
        res.sendStatus(503)
    }
})

export default router