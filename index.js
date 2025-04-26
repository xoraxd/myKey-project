const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;


const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
const secretKey='123'


const urlencodedParser = express.urlencoded({extended: false});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "hbs");
app.set('views', path.join(__dirname, 'views'));


// Подключение к MySQL
const connection = mysql.createPool({
    connectionLimit: 10,
    user:'root',
    host:'localhost',
    password:'root',
    database:'loginsystem'
});

///////////////////////////////////////////////////// Сайт

// Список ключей
app.get ('/users',function(_,res){
   const query = 'select Id, username from users'
   connection.query(query, (err, results) => {
    console.log(results);
    
    if(err){
      console.log("Ошибка при отправке на сайт! ", err);
      
    }
    res.render('users.hbs',{
      users:results
    }
 
  
  )
  })  


})
app.get('/keys',function(_,res){
  
  const query = 'select allkeys.id,allkeys.nameKey,allkeys.number, allkeys.location, users.username as keyOwner from allkeys left join users on allkeys.location=users.token;'
  connection.query(query, (err, results) => {
    console.log(results);
    
    if(err){
      console.log("Ошибка при отправке на сайт! ", err);
      
    }
    res.render('main.hbs',{
      keys:results
    }
 
  
  )
  })  

})
// Добавление ключей
app.get('/createKeys',function(req,res){
    res.render('createKeys.hbs',{})
})
app.post('/createKeys',urlencodedParser,function(req,res){

  const nameKey=req.body.nameKey;
  const number=req.body.number;

  
  
  const query = 'INSERT INTO allkeys (nameKey, number) VALUES (?, ?)'
  connection.query(query, [nameKey,number], (err, results) => {
    if(err){console.log('Ошибка при записи ключа ', err);
    }
    res.render('createKeys.hbs',{})
    res.redirect("/keys");
  })
 
})
// Изменение ключей
app.get('/edit/:id', function(req,res){

  const id=req.params.id
  console.log(id);
  
  const query = 'SELECT * FROM allkeys where id=?'
  connection.query(query, [id], (err, results) => {
    if(err) return console.log(err);
    res.render('edit.hbs',{
      key:results[0]
    })
  
  })
  
})
app.post('/edit',urlencodedParser, function(req,res){
  const nameKey=req.body.nameKey;
  const number=req.body.number;
  const id=req.body.id;
  
  const query = "UPDATE allkeys SET nameKey=?, number=? WHERE id=?"
  connection.query(query, [nameKey,number, id], (err, results) => {
    
    console.log(err);
    
   
    res.redirect("/keys");
  })
 
})
app.post('/delete/:id',urlencodedParser, function(req,res){
  const query = "DELETE FROM allkeys WHERE id=?"
  const id=req.params.id;
  connection.query(query, [id], (err, results) => {
    if(err)console.log("Ошибка удаления ключа", err);
    
    res.redirect("/keys");
  })
  
})
///////////////////////////////////////////////////

// POST-запрос для сохранения данных в MySQL
app.post('/api/data',async (req, res) => {
try{
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(username, hashedPassword);
  const token = jwt.sign(
    { username, password },
    secretKey,

  );

  const query = 'INSERT INTO users (username, password, token) VALUES (?, ?, ?)'
  connection.query(query, [username, hashedPassword, token], (err, results) => {
    console.log('Ошибки',err);
    console.log('Некоторые данные',results);
    

    if(username!='' && password!=''){
   
    return res.json({username:username,token:token, success: true, message: 'Регистрация прошла успешно!' });}
      
    else{
      return res.json({ success: false, message: 'Ошибка' });
    }
  });
}catch(error) {
  console.log('ERR', error);
  
  return res.json({ success: false, message: 'Ошибка' });
}
});
app.post('/login',async(req,res)=>{
  try{ 
    const { username, password } = req.body;
    console.log('Имя',username);
    console.log("Пароль пришел",password);


  const isMatch = await bcrypt.compare(password, password);

  const query = 'SELECT * FROM users WHERE username =?'
  connection.query(query,[username], async(err,results)=>{

    if(username=='' || password=='' ){
      return res.json({ success: false, message: 'Произошла ошибка, проверьте логин или пароль' });
    }
    console.log(results);
   const token=results[0].token

    const isMatch = await bcrypt.compare(password, results[0].password);
    console.log(isMatch);
    console.log(token);
    if(isMatch){
      return res.json({username:username, token:token, success: true, message: 'Авторизация прошла успешно!' });

    }
    
    
   
    else{
        return res.json({ success: false, message: 'Произошла ошибка, проверьте логин или пароль' });
      }
   
  })
}catch(err){
  console.log('Err', err);
  return res.json({ success: false, message: 'Произошла ошибка, проверьте логин или пароль' });
}
 
})
app.get('/key/data',(req,res)=>{
  try{  
    const query = `select * from allKeys`

    connection.query(query,(err,results)=>{
    if(err){
      console.log('Ошибка ',err);
      
    }
   
    
    return res.json({results});
  
    }
  
  )} 
  catch(error){
    console.log('Ошибка при отправке всех ключей клиенту', error);
    
  }

})
// Поиск ключа
app.get('/key/search',(req,res)=>{
  try{  
    const query = `select allkeys.nameKey,allkeys.number, allkeys.location, users.username as keyOwner from allkeys left join users on allkeys.location=users.token;`
 
    connection.query(query,(err,results)=>{
    if(err){
      console.log('Ошибка ',err);
      
    }
   
    
    return res.json({results});
  
    }
  
  )} 
  catch(error){
    console.log('Ошибка при отправке всех ключей клиенту', error);
    
  }

})

  app.post('/key/datas',async(req,res)=>{
    try{

    const {dataKey} = req.body;
    console.log('Полученные данные: ',dataKey);
    if (dataKey.value2){
  
    dataKey.value2.forEach( async (item) => {

        const query =`UPDATE allkeys
                      SET location=null
                      where nameKey=(?);`
        connection.query(query, [item.value], (error, results) => {
        if (error) console.log('Error',error);
        
        console.log(`Удаление выполено: ${item.location}`);
          
        

  });   
     

    }); }
    if(dataKey.value){
      dataKey.value.forEach(item => {
      const query =`UPDATE allkeys
                    SET location=(?)
                    where nameKey=(?);`
      connection.query(query, [item.location,item.value], (error, results) => {
     
      console.log(`Добавлена запись с ID: ${item.location}`);
      if (error) console.log('Error',error);
      // return res.json({results});
      });     
    }); 
  
    return res.json({success: true, message: 'Ключи добавлены' });
  }
    }
    catch(error){
      console.log('Ошибка при отправке ключей в БД', error);
      
    }
}
)
// Запуск сервера

app.listen(port,()=>{console.log('Сервер запущен: '+ port);
});
// app.listen(3000);
