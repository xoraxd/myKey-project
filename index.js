const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const port = 5000;


const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
const secretKey='123'


const urlencodedParser = express.urlencoded({extended: false});
// Middleware
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
// app.use('/main',function(_,res){
//   res.render('main.hbs',{
//     title:'мои контакты',
//     email:'asdasd',
//     phone:'asdasdasdafg21312515'
//   })

// })
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
  // const { nameKey, number } = req.body;
  const nameKey=req.body.nameKey;
  const number=req.body.number;
  // console.log(req.body);
  
  
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
  // res.render('edit.hbs')
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
  // console.log('Измениение ', id);
  
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
// connection.connect((err) => {
//   if (err) {
//     console.error('Ошибка подключения к MySQL:', err);
//   } else {
//     console.log('Подключение к MySQL успешно установлено');
//   }
// });

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
  // const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
  const query = 'INSERT INTO users (username, password, token) VALUES (?, ?, ?)'
  connection.query(query, [username, hashedPassword, token], (err, results) => {
    console.log('Ошибки',err);
    console.log('Некоторые данные',results);
    
    // if(err){return res.json('Ошибка' + err);
    // }
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

  // console.log('ТОКЕН ПОЛЬЗОВАТЕЛЯ', token);
  const isMatch = await bcrypt.compare(password, password);
  // const query = 'SELECT * FROM users WHERE username =? AND password =?';
  // const hashedPassword =  bcrypt.hash(password, 10);
  // console.log(hashedPassword);
  // const query = 'SELECT * FROM users WHERE username =? and token=? '
  const query = 'SELECT * FROM users WHERE username =?'
  connection.query(query,[username], async(err,results)=>{
    // console.log(query)
    // const userData = results[0]; // Первая строка результата
    // console.log('Данные пользователя:', userData);
    if(username=='' || password=='' ){
      return res.json({ success: false, message: 'Произошла ошибка, проверьте логин или пароль' });
    }
    console.log(results);
   const token=results[0].token
    // console.log(res);
    // console.log(results[0].password);
    const isMatch = await bcrypt.compare(password, results[0].password);
    console.log(isMatch);
    console.log(token);
    
    // console.log(isMatch);

    // if(isMatch && token)
    //   if(isMatch){
    //   const token = jwt.sign(
    //     { userId: results[0].id, username: results[0].username },
    //     secretKey,
    //     { expiresIn: '1h' } 
    //   );
    if(isMatch){
      return res.json({username:username, token:token, success: true, message: 'Авторизация прошла успешно!' });
    // }
    }
    
    
   
    else{
        return res.json({ success: false, message: 'Произошла ошибка, проверьте логин или пароль' });
      }
   
    // const isMatch =  bcrypt.compare(password, results.password);
    // console.log('isMatch',isMatch);
    
    // if(results!=''){
      
    // return res.json({ success: true, message: 'Авторизация прошла успешно!' });

  // } else{
  //   return res.json({ success: false, message: 'Произошла ошибка, проверьте логин или пароль' });
  // }
    // if (!username || !password) {
    //   return res.status(400).json({ success: false, message: 'Не указаны имя пользователя или пароль' });}
   
  })
}catch(err){
  console.log('Err', err);
  return res.json({ success: false, message: 'Произошла ошибка, проверьте логин или пароль' });
}
 
})
app.get('/key/data',(req,res)=>{
  try{  
    const query = `select * from allKeys`
    // res.set({
    //   'Cache-Control': 'no-store',
    //   'Pragma': 'no-cache',
    //   'Expires': '0',
    // });
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
      // res.set({
      //   'Cache-Control': 'no-store, no-cache, must-revalidate',
      //   'Pragma': 'no-cache',
      //   'Expires': '0',
      // });
    const {dataKey} = req.body;
    console.log('Полученные данные: ',dataKey);
    if (dataKey.value2){
  
    dataKey.value2.forEach( async (item) => {
      // console.log(`ID: ${item.id}, Value: ${item.value}`);
      // console.log('item.nameKey: ',item.nameKey);
      
    
        // console.log('НУЛЬ!',item.location);
        const query =`UPDATE allkeys
                      SET location=null
                      where nameKey=(?);`
        connection.query(query, [item.value], (error, results) => {
        if (error) console.log('Error',error);
        
        console.log(`Удаление выполено: ${item.location}`);
          
        
  // return res.json({success: true, message: 'Удаление выполено!' });
  });   
     
      // else{
      // const query =`UPDATE allkeys
      //               SET location=1
      //               where nameKey=(?);`
      // connection.query(query, [item.value], (error, results) => {
     
      // console.log(`Добавлена запись с ID: ${item.location}`);
      // if (error) console.log('Error',error);
      // // return res.json({results});
      // });}          
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

  // console.log('Пользователь, взял:', dataKey.value[0]);
 
  // const query = `select nameKey,location from allKeys where location is not null`;
//   const query = `select * from allKeys`
//   connection.query(query,(err,results)=>{
//   // console.log(results);
  
//   // if(err){return results.json('Ошибка' + err);}
//   return res.json({ results});

//   }
// )
}
)
// Запуск сервера

app.listen(port,'192.168.0.7',()=>{console.log('Сервер запушщен 192.168.0.7:'+ port);
});
// app.listen(3000);