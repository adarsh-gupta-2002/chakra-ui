import React, { useRef } from 'react'
import {Box , Container , VStack , HStack,Button, Input} from "@chakra-ui/react"
import Message from "./Components/Message"
import { onAuthStateChanged ,getAuth , signOut ,GoogleAuthProvider , signInWithPopup} from "firebase/auth"
import {app} from './Components/firebase'
import {getFirestore , serverTimestamp , addDoc , collection , onSnapshot , query , orderBy} from 'firebase/firestore'

const auth  = getAuth(app) 
const db = getFirestore(app)

const loginHandler = () =>{ 
    const provider = new GoogleAuthProvider()

    signInWithPopup(auth , provider)
}

const logoutHandler = () => signOut(auth)


const App = () => {
    

    const [user , setUser ] = React.useState(false)
    const [message , setMessage] = React.useState('')
    const [messages , setMessages] = React.useState([])

    const divForScroll =useRef(null)

    React.useEffect(() =>{
        const   q = query(collection(db , "Messages"), orderBy("createdAt" , ))
        const unsubscribe = onAuthStateChanged(auth , (data) => {
            setUser(data)
        })

        const unsubscribeForMessage  = onSnapshot( q ,(snap) => {
            setMessages(
                snap.docs.map((item) => {
                    const id = item.id;
                    return {id , ...item.data()}
                })
            );
        })

        return () =>{
            unsubscribe()
            unsubscribeForMessage()
        }
    },[])

    const submitHandler = async (e) => {
        e.preventDefault()
    
        try{
            setMessage("")
    
            await addDoc(collection(db, "Messages"),{
                text:message,
                uid:user.uid,
                uri: user.photoURL,
                createdAt: serverTimestamp(),


            })

            divForScroll.current.scrollIntoView({behavior : "smooth"})
    
        }catch(error){
            alert(error)
        }
    }
    return (
        <Box bg = {"red.50"}>
            {user ? (<Container h = {"100vh"} bg={'white'}>
                <VStack h = {"full"} paddingY= {"4"}>

                    <Button onClick={logoutHandler} w = {"full"} colorScheme={"red"}>Logout</Button>

                    <VStack overflowY={"auto"} h={"full"} w = {"full"} css={{"&::-webkit-scrollbar":{
                        display : "none",
                    },}}  > 
                    
                    {
                        messages.map(item => (
                            <Message
                            key = {item.id}
                            user = {item.uid === user.uid ? "me":"other"}
                            text = {item.text} uri = {item.url} />
                        ))
                    }

                        <div ref={divForScroll} ></div>
                    </VStack>
                        <form onSubmit={submitHandler} style = {{width:"100%" ,  }} action="">
                            <HStack>
                            <Input 
                            value = {message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter A Message" />
                            <Button colorScheme={"purple"} type="submit">Send</Button>
                            </HStack>
                        </form>
                    

                </VStack>
            </Container>):(
                <VStack bg = {"white" } 
                justifyContent={'center'}
                h  = {"100vh"}>
                    <Button onClick={loginHandler} colorScheme="purple" >Sign In With Google</Button>
                    
                </VStack>
            )}
        </Box>
    )
}


export default App