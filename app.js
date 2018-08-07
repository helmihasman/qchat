var express = require('express');
var multer  =   require('multer');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require("express-session")({
    secret: "secretpassqchat123456",
    resave: true,
    saveUninitialized: true
});

// Enable CORS
var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
};

var expressValidator = require('express-validator');
var methodOverride = require('method-override');
var fs = require('fs');

var mysql = require('mysql');
var request = require('request');

var fs = require("fs");

var routes = require('./routes/index');
var users = require('./routes/users');
//var customers = require('./routes/customers');
//var admin_users = require('./routes/admin_users');

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

//var inside = require('point-in-geopolygon');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Store = require('express-session').Store;

var sharedsession = require("express-socket.io-session");

app.use(function(req, res, next){
  res.io = io;
  next();
});

var global_user_id = '';
var global_language = '';
var global_company_id = '';

// Variable deployPath is set in web.config and must match
// the path of app.js in virtual directory.
// If app.js is run from command line:
//   "C:/tssapp-deploy/tsappsvr/TestExpress/0.0.0> node app.js"
// deployPath is set to empty string.
var deployPath = process.env.deployPath || "";

console.log("deployPath==="+deployPath);

// Static content server
app.use(deployPath + "/pages", express.static(__dirname + '/public'));

// REST API handler (placeholder)
app.all(deployPath + "/api", function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end("<h2>REST API Handler found.</h2>");
});

app.use(allowCrossDomain);

// Default handler
//app.get(deployPath + "/", function(req, res) {
//  res.writeHead(200, {'Content-Type': 'text/html'});
//  res.end("<h2>Default Handler found.</h2>");
//});

//http.listen(80);
//var port = app.settings.port;
//var port2 = app.get('port');
http.listen(process.env.PORT || 3000, function(){
 // console.log('listening on **:'+process.env.PORT);
// console.log('listening on **:'+port);
// console.log('listening on **$:'+port2);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(session);
app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});

app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(expressValidator());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static(process.cwd() + '/uploads'));

app.use('/', routes);
app.use('/users', users);

//passport
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now()+'.jpg');
  }
});

var storage_image =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, '/uploads/image/');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now()+'.jpg');
  }
});

var upload = multer({ storage : storage}).single('floorplan_img');
var upload_emp_image = multer({ storage : storage}).single('emp_image');

var upload_image = multer({ storage : storage_image}).single('file');

app.use(methodOverride(function(req, res){
 if (req.body && typeof req.body === 'object' && '_method' in req.body) 
   { 
      var method = req.body._method;
      delete req.body._method;
      return method;
    } 
  }));


//var connect_mysql = mysql.createPool({
//     host:'us-cdbr-iron-east-04.cleardb.net',
//     user:'b753688ff4397b',
//     password:'a2c32182',
//     port:3306,
//     database:'ad_4a07813f131a943'
//});


//Qchat development
//var con = mysql.createConnection({
//    host: "us-cdbr-sl-dfw-01.cleardb.net",
//    user: "bf0ba532c5ea11",
//    password: "5d2e7966",
//    database: "ibmx_5615f24298630b0"
//});

//Qchat production
//var con = mysql.createConnection({
//    host: "us-cdbr-sl-dfw-01.cleardb.net",
//    user: "be5751a8fb97c0",
//    password: "16126bbe",
//    database: "ibmx_7b9b06ebe049e12"
//});

//Qchat compose production pool
var con = mysql.createPool({
    host: "sl-us-south-1-portal.19.dblayer.com",
    user: "admin",
    password: "XPONHULHEZMIPZZH",
    database: "compose",
    port:37139,
    connectionLimit : 100,
    waitForConnections : true,
    queueLimit :0,
    debug    :  false,
    wait_timeout : 28800,
    connect_timeout :1
});

//Qchat compose production
//var con = mysql.createConnection({
//    host: "sl-us-south-1-portal.19.dblayer.com",
//    user: "admin",
//    password: "XPONHULHEZMIPZZH",
//    database: "compose",
//    port:37139
//});
 
app.post(deployPath +"/login", passport.authenticate('local_qchat', {
    
    successRedirect: deployPath +'/tracking',

    failureRedirect: deployPath +'/login',

    failureFlash: true

}), function(req, res, info){
    
    res.render('login',{'message' :req.flash('message')});

});

//app.post('/login',function(req,res,next){
//    
//    console.log("inpost login dummy");
//});
app.get(deployPath +'/language/:lan',isAuthenticated,function(req,res,next){
     var language = req.params.lan;
     req.session.language = language;
     res.redirect('/tracking');
    
   
});

app.get(deployPath +'/language/:lan',isAuthenticated,function(req,res,next){
     var language = req.params.lan;
     req.session.language = language;
     res.redirect('/tracking');
    
   
});
app.get(deployPath +'/map_test',function(req,res,next){
     res.render('map_test',{title:"Home"});
    
   
});

var audio=0,note=0,photo=0,alert_bil=0,sum=0;
app.get(deployPath +'/',isAuthenticated, function(req, res, next) {
    
    var employee,alert,notification;
    var company_id = req.session.passport.user.company_id;
//    var audio=0,note=0,photo=0,alert_bil=0,sum=0;
    
//    con.query("SELECT count(*) as bil,document_type FROM document where document_status = 'read' group by document_type",function(error,rows,fields){
//       if(!!error){
//           console.log('Error in the query '+error);
//       }
//       else{
//           //console.log('Successful query\n');
//           //console.log(rows);
//           for(var i=0;i<rows.length;i++){
//               if(rows[i].document_type === 'Audio'){
//                   audio = rows[i].bil;
//               }
//               else if(rows[i].document_type === 'Note'){
//                   note = rows[i].bil;;
//               }
//               else if(rows[i].document_type === 'Photo'){
//                   
//                   photo = rows[i].bil;
//               }
//           }
//           
//            con.query("SELECT count(*) as bil FROM document where document_status = 'unread'",function(error,rows,fields){
//                if(!!error){
//                    console.log('Error in the query '+error);
//                }
//                else{
//                    //console.log('Successful query\n');
//                    //console.log(rows);
//                    alert_bil = rows[0].bil;
//                    
//                     console.log("audio-"+audio+" note-"+note+" photo-"+photo+" alert_bil-"+alert_bil);
//                     req.session.audio = audio;
//                     req.session.note = note;
//                     req.session.photo = photo;
//                     req.session.alert = alert_bil;
//                     sum = audio + note + photo + alert_bil;
//                     console.log("sum-"+sum);
//                    req.session.sum = sum;
//                    console.log("audio-"+req.session.audio+" note-"+req.session.note+" photo-"+req.session.photo+" alert_bil-"+req.session.alert+" sum-"+req.session.sum);
//                     
//                }
//            }); 
//            
//            
//                console.log("audio2-"+audio+" note2-"+note+" photo2-"+photo+" alert_bil2-"+alert+" sum2-"+sum);
//           
//       }
//       
//   }); 
                    
  
   
  con.query("SELECT * FROM document left join employee on document.doc_emp_id = employee.employee_id left join location on document.document_location = location.location_code where document.document_status = 'read' and employee.company_id='"+company_id+"' order by document.document_time desc limit 5",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           notification = rows;
       }
   }); 
   
   
   con.query("SELECT * FROM document left join employee on document.doc_emp_id = employee.employee_id left join location on document.document_location = location.location_code where document.document_status = 'unread' and employee.company_id='"+company_id+"' order by document.document_time desc limit 5",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           alert = rows;
       }
   }); 
   
   con.query("SELECT * FROM employee where employee_level = '2' and company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           employee = rows;
           
           con.query("SELECT count(*) as bil,document_type FROM document left join employee on document.doc_emp_id = employee.employee_id where document.document_status = 'read' and employee.company_id='"+company_id+"' group by document_type",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                //console.log('Successful query\n');
                //console.log(rows);
                for(var i=0;i<rows.length;i++){
                    if(rows[i].document_type === 'Audio'){
                        audio = rows[i].bil;
                    }
                    else if(rows[i].document_type === 'Note'){
                        note = rows[i].bil;;
                    }
                    else if(rows[i].document_type === 'Photo'){

                        photo = rows[i].bil;
                    }
                }

                 con.query("SELECT count(*) as bil FROM document left join employee on document.doc_emp_id = employee.employee_id where document_status = 'unread' and employee.company_id='"+company_id+"'",function(error,rows,fields){
                     if(!!error){
                         console.log('Error in the query '+error);
                     }
                     else{
                         //console.log('Successful query\n');
                         //console.log(rows);
                         alert_bil = rows[0].bil;

                          //console.log("audio-"+audio+" note-"+note+" photo-"+photo+" alert_bil-"+alert_bil);
                          
                       req.session.audio = audio;
                          req.session.note = note;
                          req.session.photo = photo;
                          req.session.alert = alert_bil;
                          sum = audio + note + photo + alert_bil;
                          //console.log("sum-"+sum);
                         req.session.sum = sum;
                        //console.log("audio2-"+audio+" note2-"+note+" photo2-"+photo+" alert_bil2-"+alert_bil+" sum2-"+sum);
                         //console.log("audio3-"+req.session.audio+" note3-"+req.session.note+" photo3-"+req.session.photo+" alert_bil3-"+req.session.alert+" sum3-"+req.session.sum);
                       if(req.session.language === 'en'){
                           res.render('index_en',{title:"Home",employee:employee,alert:alert,notification:notification});
                       }
                       else{
                           res.render('index',{title:"Home",employee:employee,alert:alert,notification:notification});
                       }

                     }
                 });     

            }

        }); 
                        
//           res.render('index',{title:"Home",employee:employee,alert:alert,notification:notification});
       }
   }); 
  //res.render('index', { title: 'Home' });
});

//----------------------------DOCUMENTS----------------------------

app.get(deployPath +'/documents',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * FROM document left join employee on document.doc_emp_id = employee.employee_id left join location on document.document_location = location.location_code left join company on employee.company_id = company.company_id where document.document_status = 'read' and company.company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           if(req.session.language === 'en'){
           res.render('documents_en',{title:"Documents",data:rows});
           }
           else{
            res.render('documents',{title:"Documents",data:rows});
           }
       }
   }); 
   
});

//----------------------------DOCUMENTS----------------------------

//----------------------------ALERT----------------------------
app.get(deployPath +'/alert',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * FROM document left join employee on document.doc_emp_id = employee.employee_id left join location on document.document_location = location.location_code left join company on company.company_id = employee.company_id where document.document_status = 'unread' and company.company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           if(req.session.language === 'en'){
               res.render('alert_en',{title:"Alert",data:rows});
           }
           else{
               res.render('alert',{title:"Alert",data:rows});
           }
           //res.render('alert',{title:"Alert",data:rows});
       }
   }); 
});

app.get(deployPath +'/alert/:id',isAuthenticated,function(req,res,next){
    var doc_id = req.params.id;
    console.log("doc_id--"+doc_id);
    
    con.query("UPDATE document set document_status = 'read' where document_id = '"+doc_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
//           res.render('employee_management',{title:"Employee Management",data:rows});
            next();
       }
   }); 
   
});
//----------------------------ALERT----------------------------


//----------------------------EMPLOYEE MANAGEMENT----------------------------
app.get(deployPath +'/employee_management',isAuthenticated,function(req,res,next){
    var company_id = req.session.passport.user.company_id;
    console.log("company_id ="+company_id);
    if(company_id === "0" || company_id === 0){
        con.query("SELECT * FROM employee left join company on employee.company_id = company.company_id where employee_level != '0'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                //console.log('Successful query11\n');
                //console.log(rows);
                 if(req.session.language === 'en'){
                     res.render('employee_management_en',{title:"Employee Management",data:rows});
                 }
                 else{
                     res.render('employee_management',{title:"Employee Management",data:rows});
                 }
     //           res.render('employee_management',{title:"Employee Management",data:rows});
            }
        });
    }
    else{
        con.query("SELECT * FROM employee left join company on employee.company_id = company.company_id where employee.company_id = '"+company_id+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                //console.log('Successful query\n');
                //console.log(rows);
                 if(req.session.language === 'en'){
                     res.render('employee_management_en',{title:"Employee Management",data:rows});
                 }
                 else{
                     res.render('employee_management',{title:"Employee Management",data:rows});
                 }
     //           res.render('employee_management',{title:"Employee Management",data:rows});
            }
        });
    }
     
    //res.render('employee_management',{title:"Employee Management"});
});

app.get(deployPath +'/employee_add',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    var company;
    
    if(company_id === "0" || company_id === 0){
        
        con.query("SELECT * FROM company",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                //console.log('Successful query\n');
                //console.log(rows);
                 if(req.session.language === 'en'){
                     res.render('employee_add_en',{title:"Add Employee",data:rows});
                 }
                 else{
                     res.render('employee_add',{title:"Add Employee",data:rows});
                 }
     //           res.render('employee_management',{title:"Employee Management",data:rows});
            }
        });
        
    }
    
    else{
        con.query("SELECT * FROM company where company_id ='"+company_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query '+error);
           }
           else{
               //console.log('Successful query\n');
               //console.log(rows);
               company = rows;
               con.query("SELECT * FROM category where company_id ='"+company_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                    }
                    else{
                        //console.log('Successful query\n');
                        //console.log(rows);
                         if(req.session.language === 'en'){
                             res.render('employee_add_en',{title:"Add Employee",data:company,category:rows});
                         }
                         else{
                             res.render('employee_add',{title:"Add Employee",data:company,category:rows});
                         }
             //           res.render('employee_management',{title:"Employee Management",data:rows});
                    }
                }); 
       
                
    //           res.render('employee_management',{title:"Employee Management",data:rows});
           }
       }); 
    }
    
   //res.render('company_add',{title:"Add Employee"});

});

app.post(deployPath +'/employee/add',isAuthenticated,function(req,res,next){
    
    v_employee_name = req.sanitize( 'employee_name' ); 
    v_employee_phone_no = req.sanitize( 'employee_phone_no' );
    v_employee_email = req.sanitize( 'employee_email' );
    v_employee_motto = req.sanitize( 'employee_motto' );
    v_employee_address = req.sanitize( 'employee_address' );
    v_employee_password = req.sanitize( 'employee_password' );
    v_employee_level = req.sanitize( 'employee_level' );
    v_company_id = req.sanitize( 'company_id' );
    v_category_id = req.sanitize( 'category_id' );
    
    
    con.query("INSERT INTO employee(employee_name,employee_phone_no,employee_email,employee_motto,employee_address,employee_password,employee_level,company_id,category_id) values ('"+v_employee_name+"','"+v_employee_phone_no+"','"+v_employee_email+"','"+v_employee_motto+"','"+v_employee_address+"','"+v_employee_password+"','"+v_employee_level+"','"+v_company_id+"','"+v_category_id+"')",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
    res.redirect(deployPath +'/employee_management');
    

});

app.get(deployPath +'/employee/delete/:id',isAuthenticated,function(req,res,next){
    
     var employee_id = req.params.id;
   
    con.query("DELETE from employee where employee_id = '"+employee_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
        res.redirect(deployPath +'/employee_management');
    

});

//---------- Company----------
app.get(deployPath +'/company_management',isAuthenticated,function(req,res,next){
    con.query("SELECT * from company",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render('company_management_en',{title:"Company Management",data:rows});
            }
            else{
                res.render('company_management',{title:"Company Management",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.get(deployPath +'/company_add',isAuthenticated,function(req,res,next){
    
   if(req.session.language === 'en'){
       res.render('company_add_en',{title:"Add Company"});
   }
   else{
       res.render('company_add',{title:"Add Company"});
   }

});

app.post(deployPath +'/company/add',isAuthenticated,function(req,res,next){
    
    v_company_name = req.sanitize( 'company_name' ); 
    v_company_reg_no = req.sanitize( 'company_reg_no' );
    v_company_address = req.sanitize( 'company_address' );
    v_company_website = req.sanitize( 'company_website' );
    v_company_phone_no = req.sanitize( 'company_phone_no' );
    v_company_email = req.sanitize( 'company_email' );
    v_location = req.sanitize( 'location' );
    
    
    con.query("INSERT INTO company(company_name,company_address,company_website,company_phone_no,company_email,company_reg_no,company_location) values ('"+v_company_name+"','"+v_company_address+"','"+v_company_website+"','"+v_company_phone_no+"','"+v_company_email+"','"+v_company_reg_no+"','"+v_location+"')",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
    res.redirect(deployPath +'/company_management');
    

});

app.get(deployPath +'/company/edit/:id',isAuthenticated,function(req,res,next){
    var company_id = req.params.id;
    con.query("SELECT * FROM company where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render('company_edit_en',{title:"Company",data:rows});
            }
            else{
                res.render('company_edit',{title:"Company",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.post(deployPath +'/company/edit/:id',isAuthenticated,function(req,res,next){
    var company_id = req.params.id;
    v_company_name = req.sanitize( 'company_name' ); 
    v_company_reg_no = req.sanitize( 'company_reg_no' );
    v_company_address = req.sanitize( 'company_address' );
    v_company_website = req.sanitize( 'company_website' );
    v_company_phone_no = req.sanitize( 'company_phone_no' );
    v_company_email = req.sanitize( 'company_email' );
    v_location = req.sanitize( 'location' );
    
    con.query("UPDATE company set company_name='"+v_company_name+"',company_reg_no='"+v_company_reg_no+"',company_address='"+v_company_address+"',company_website='"+v_company_website+"',company_phone_no='"+v_company_phone_no+"',company_email='"+v_company_email+"',company_location='"+v_location+"' where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            res.redirect(deployPath +'/company_management');
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.get(deployPath +'/company/delete/:id',isAuthenticated,function(req,res,next){
    
     var company_id = req.params.id;
   
    con.query("DELETE from company where company_id = '"+company_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
        res.redirect(deployPath +'/company_management');
    

});

//---------- Building----------
app.get(deployPath +'/building_management',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * from building where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render('building_management_en',{title:"Building Management",data:rows});
            }
            else{
                res.render('building_management',{title:"Building Management",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.get(deployPath +'/building_add',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * from region where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render('building_add_en',{title:"Add Building",data:rows});
            }
            else{
                res.render('building_add',{title:"Add Building",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    
});

app.post(deployPath +'/building/add',isAuthenticated,function(req,res,next){
    
    v_building_name = req.sanitize( 'building_name' ); 
    v_building_add = req.sanitize( 'building_add' );
    v_location = req.sanitize( 'location' );
    v_region = req.sanitize( 'region' );
    console.log("v_building_add---"+v_building_add);
    var company_id = req.session.passport.user.company_id;
    
    con.query("INSERT INTO building(building_name,building_add,building_location,company_id,region_id) values ('"+v_building_name+"','"+v_building_add+"','"+v_location+"','"+company_id+"','"+v_region+"')",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
    res.redirect(deployPath +'/building_management');
    

});

app.get(deployPath +'/building/delete/:id',isAuthenticated,function(req,res,next){
    
    var building_id = req.params.id;
   
    con.query("DELETE from building where building_id = '"+building_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
        res.redirect(deployPath +'/building_management');
    

});

app.get(deployPath +'/building/edit/:id',isAuthenticated,function(req,res,next){
    var building_id = req.params.id;
    var building;
    var company_id = req.session.passport.user.company_id;
    con.query("SELECT * FROM building left join region on building.region_id = region.region_id where building.building_id='"+building_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           building = rows;
           con.query("SELECT * from region where company_id='"+company_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                    }
                    else{
                        //console.log('Successful query\n');
                        //console.log(rows);
                         if(req.session.language === 'en'){
                                res.render('building_edit_en',{title:"Building",data:building,region:rows});
                            }
                            else{
                                res.render('building_edit',{title:"Building",data:building,region:rows});
                            }
             //           res.render('employee_management',{title:"Employee Management",data:rows});
                    }
                }); 
            
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.post(deployPath +'/building/edit/:id',isAuthenticated,function(req,res,next){
    var building_id = req.params.id;
    v_building_name = req.sanitize( 'building_name' ); 
    v_building_address = req.sanitize( 'building_add' );
    v_location = req.sanitize( 'location' );
    v_region = req.sanitize( 'region' );
    
    con.query("UPDATE building set building_name='"+v_building_name+"',building_add='"+v_building_address+"',building_location='"+v_location+"',region_id='"+v_region+"' where building_id='"+building_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            res.redirect(deployPath +'/building_management');
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

//---------- Region----------
app.get(deployPath +'/region_management',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * from region where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render('region_management_en',{title:"Region Management",data:rows});
            }
            else{
                res.render('region_management',{title:"Region Management",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.get(deployPath +'/region_add',isAuthenticated,function(req,res,next){
    
   if(req.session.language === 'en'){
       res.render('region_add_en',{title:"Add Region"});
   }
   else{
       res.render('region_add',{title:"Add Region"});
   }

});

app.post(deployPath +'/region/add',isAuthenticated,function(req,res,next){
    
    v_region_name = req.sanitize( 'region_name' );
    var company_id = req.session.passport.user.company_id;
    
    
    con.query("INSERT INTO region(region_name,company_id) values ('"+v_region_name+"','"+company_id+"')",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
    res.redirect(deployPath +'/region_management');
});

app.get(deployPath +'/region/delete/:id',isAuthenticated,function(req,res,next){
    
    var region_id = req.params.id;
   
    con.query("DELETE from region where region_id = '"+region_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
        res.redirect(deployPath +'/region_management');
    

});

app.get(deployPath +'/region/edit/:id',isAuthenticated,function(req,res,next){
    var region_id = req.params.id;
    con.query("SELECT * FROM region where region_id='"+region_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render('region_edit_en',{title:"Region",data:rows});
            }
            else{
                res.render('region_edit',{title:"Region",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.post(deployPath +'/region/edit/:id',isAuthenticated,function(req,res,next){
    var region_id = req.params.id;
    v_region_name = req.sanitize( 'region_name' ); 
    
    
    con.query("UPDATE region set region_name='"+v_region_name+"' where region_id='"+region_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            res.redirect(deployPath +'/region_management');
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

//---------- Group----------
app.get(deployPath +'/group_management',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * from group_table where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render('group_management_en',{title:"Group Management",data:rows});
            }
            else{
                res.render('group_management',{title:"Group Management",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.get(deployPath +'/group_add',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * from building where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render('group_add_en',{title:"Add Group",data:rows});
            }
            else{
                res.render('group_add',{title:"Add Group",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   });


});

app.post(deployPath +'/group/add',isAuthenticated,function(req,res,next){
    
    v_group_name = req.sanitize( 'group_name' );
    v_group_desc = req.sanitize( 'group_desc' );
    v_building = req.sanitize( 'building' );
    var company_id = req.session.passport.user.company_id;
    
    
    con.query("INSERT INTO group_table(group_name,group_desc,company_id,building_id) values ('"+v_group_name+"','"+v_group_desc+"','"+company_id+"','"+v_building+"')",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
    res.redirect(deployPath +'/group_management');
});

app.get(deployPath +'/group/delete/:id',isAuthenticated,function(req,res,next){
    
    var group_id = req.params.id;
   
    con.query("DELETE from group_table where group_id = '"+group_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
        res.redirect(deployPath +'/group_management');
    

});

app.get(deployPath +'/group/edit/:id',isAuthenticated,function(req,res,next){
    var company_id = req.session.passport.user.company_id;
    var group_id = req.params.id;
    var group;
    con.query("SELECT * FROM group_table left join building on group_table.building_id = building.building_id where group_id='"+group_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           group= rows;
           con.query("SELECT * from building where company_id='"+company_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                    }
                    else{
                        //console.log('Successful query\n');
                        //console.log(rows);
                         if(req.session.language === 'en'){
                                res.render('group_edit_en',{title:"Group",data:group,building:rows});
                            }
                            else{
                                res.render('group_edit',{title:"Group",data:group,building:rows});
                            }
             //           res.render('employee_management',{title:"Employee Management",data:rows});
                    }
                });
            
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.post(deployPath +'/group/edit/:id',isAuthenticated,function(req,res,next){
    var group_id = req.params.id;
    v_group_name = req.sanitize( 'group_name' );
    v_group_desc = req.sanitize( 'group_desc' );
    
    
    con.query("UPDATE group_table set group_name='"+v_group_name+"',group_desc='"+v_group_desc+"' where group_id='"+group_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            res.redirect(deployPath +'/group_management');
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});


//---------- Category----------
app.get(deployPath +'/category_management',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * from category where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render('category_management_en',{title:"Category Management",data:rows});
            }
            else{
                res.render('category_management',{title:"Category Management",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.get(deployPath +'/category_add',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * from group_table where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render('category_add_en',{title:"Add Category",data:rows});
            }
            else{
                res.render('category_add',{title:"Add Category",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   });
    
   

});

app.post(deployPath +'/category/add',isAuthenticated,function(req,res,next){
    
    v_category_name = req.sanitize( 'category_name' );
    v_category_desc = req.sanitize( 'category_desc' );
    v_group = req.sanitize( 'group' );
    var company_id = req.session.passport.user.company_id;
    
    
    con.query("INSERT INTO category(category_name,category_desc,company_id,group_id) values ('"+v_category_name+"','"+v_category_desc+"','"+company_id+"','"+v_group+"')",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
    res.redirect(deployPath +'/category_management');
});

app.get(deployPath +'/category/delete/:id',isAuthenticated,function(req,res,next){
    
    var category_id = req.params.id;
   
    con.query("DELETE from category where category_id = '"+category_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
        res.redirect(deployPath +'/category_management');
    

});

app.get(deployPath +'/category/edit/:id',isAuthenticated,function(req,res,next){
    var company_id = req.session.passport.user.company_id;
    var category_id = req.params.id;
    var category;
    con.query("SELECT * FROM category left join group_table on category.group_id = group_table.group_id where category_id='"+category_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           category=rows;
           con.query("SELECT * from group_table where company_id='"+company_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                    }
                    else{
                        //console.log('Successful query\n');
                        //console.log(rows);
                         if(req.session.language === 'en'){
                                res.render('category_edit_en',{title:"Category",data:category,group:rows});
                            }
                            else{
                                res.render('category_edit',{title:"Category",data:category,group:rows});
                            }
             //           res.render('employee_management',{title:"Employee Management",data:rows});
                    }
                });
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.post(deployPath +'/category/edit/:id',isAuthenticated,function(req,res,next){
    var category_id = req.params.id;
    v_category_name = req.sanitize( 'category_name' );
    v_category_desc = req.sanitize( 'category_desc' );
    v_group = req.sanitize( 'group' );
    
    
    con.query("UPDATE category set category_name='"+v_category_name+"',category_desc='"+v_category_desc+"',group_id='"+v_group+"' where category_id='"+category_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            res.redirect(deployPath +'/category_management');
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});


//----------------------------EMPLOYEE DETAILS----------------------------

app.get(deployPath +'/employee_details/:id',isAuthenticated,function(req,res,next){
     var emp_id = req.params.id;
//    var route = [];
    var route;
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT route_name,employee_id,year(route_datetime) as years,month(route_datetime) as months, day(route_datetime) as days, hour(route_datetime) as hours, minute(route_datetime) as minutes, second(route_datetime) as seconds FROM route where employee_id = '"+emp_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           route = rows;
       }
   }); 
   
    con.query("SELECT * FROM employee left join location on employee.employee_location = location.location_code where employee.employee_id='"+emp_id+"' and location.company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           if(req.session.language === 'en'){
               res.render('employee_details_en',{title:"Employee Details",data:rows,route:route});
           }
           else{
               res.render('employee_details',{title:"Employee Details",data:rows,route:route});
           }
//           res.render('employee_details',{title:"Employee Details",data:rows,route:route});
       }
   }); 
    //res.render('employee_details',{title:"Employee Details"});
});


app.get(deployPath +'/route_management',isAuthenticated,function(req,res,next){
    
    var route;
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT route_name,employee.employee_id,employee_name,employee_phone_no,year(route_datetime) as years,month(route_datetime) as months, day(route_datetime) as days, hour(route_datetime) as hours, minute(route_datetime) as minutes, second(route_datetime) as seconds FROM route left join employee on route.employee_id = employee.employee_id left join company on employee.company_id = company.company_id where company.company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           for(var i=0;i<rows.length;i++){
           if(rows[i].days < 10){
                rows[i].days = "0"+rows[i].days;
            }
            if(rows[i].months < 10){
                rows[i].months = "0"+rows[i].months;
            }

            if(rows[i].hours < 10){
                rows[i].hours = "0"+rows[i].hours;
            }
            if(rows[i].minutes < 10){
                rows[i].minutes = "0"+rows[i].minutes;
            }
            if(rows[i].seconds < 10){
                rows[i].seconds = "0"+rows[i].seconds;
            }
        }
          if(req.session.language === 'en'){
              res.render('route_management_en',{title:"Route Management",data:rows});
          }
          else{
              res.render('route_management',{title:"Route Management",data:rows});
          }
           //res.render('route_management',{title:"Route Management",data:rows});
       }
   }); 
   
   
   
    //res.render('route_management',{title:"Route Management"});
});


//----------------------------SET ROUTE----------------------------

app.get(deployPath +'/set_route',isAuthenticated,function(req,res,next){
    
   var checkpoint;
   var company_id = req.session.passport.user.company_id;
   
   con.query("SELECT * FROM location where company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
          checkpoint = rows;
       }
   }); 
   
   con.query("SELECT employee_name,employee_phone_no,employee_id FROM employee where employee_level = '2' and company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           if(req.session.language === 'en'){
               res.render('set_route_en',{title:"Set Route",data:rows,checkpoint:checkpoint});
           }
           else{
               res.render('set_route',{title:"Set Route",data:rows,checkpoint:checkpoint});
           }
//           res.render('set_route',{title:"Set Route",data:rows,checkpoint:checkpoint});
       }
   }); 
   
    //res.render('set_route',{title:"Set Route"});
});

app.post(deployPath +'/set_route/add',isAuthenticated,function(req,res,next){
    
    v_day = req.sanitize( 'day' ).escape(); 
    v_time = req.sanitize( 'time' ).escape();
    v_emp_id = req.sanitize( 'employee_id' ).escape();
    v_checkpoint = req.sanitize( 'checkpoint' ).escape();
    
    var emp_list = v_emp_id.split(",");
    var checkpoint_list = v_checkpoint.split(",");
    var datetime = v_day+" "+v_time;
    
    for(var i=0;i<emp_list.length;i++){
        for(var k=0;k<checkpoint_list.length;k++){
                con.query("INSERT INTO route(route_name,employee_id,route_datetime) values ('"+checkpoint_list[k]+"','"+emp_list[i]+"','"+datetime+"')",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
                    //console.log('Successful query\n');
                    //console.log(rows);
                    //res.redirect('/route_management');
                }
            });
        }
    }
//    if(req.session.language === 'en'){
//        res.redirect(deployPath +'/route_management_en');
//    }
//    else{
        res.redirect(deployPath +'/route_management');
//    }
//    res.redirect('/route_management');
    
//    con.query("SELECT employee_name,employee_phone_no,employee_id FROM employee ",function(error,rows,fields){
//       if(!!error){
//           console.log('Error in the query '+error);
//       }
//       else{
//           console.log('Successful query\n');
//           console.log(rows);
//           res.redirect('/route_management');
//       }
//   }); 
    
//    console.log("day=="+v_day);
//    console.log("day=="+v_time);
//    console.log("day=="+datetime);
//    console.log("day=="+v_emp_id);
//    console.log("day=="+emp_list[0]);
//    console.log("day=="+checkpoint_list[0]);
   
    //res.render('set_route',{title:"Set Route"});
});


//----------------------------LOCATION----------------------------
app.get(deployPath +'/location',isAuthenticated,function(req,res,next){
    var company_id = req.session.passport.user.company_id;
    con.query("SELECT * FROM location where company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render(deployPath +'location_en',{title:"Location",data:rows});
            }
            else{
                res.render('location',{title:"Location",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.get(deployPath +'/location_add',function(req,res,next){
    if(req.session.language === 'en'){
    res.render('location_add_en',{title:"Set Location"});
    }
    else{
        res.render('location_add',{title:"Set Location"});
    }
});

app.post(deployPath +'/location/add',isAuthenticated,function(req,res,next){
    
    v_beacon_id = req.sanitize( 'beacon_id' ).escape(); 
    v_beacon_location = req.sanitize( 'beacon_location' ).escape();
    v_beacon_level = req.sanitize( 'beacon_level' ).escape();
    v_location_code = req.sanitize( 'location_code' ).escape();
    var company_id = req.session.passport.user.company_id;
    
    
    con.query("INSERT INTO location(beacon_id,beacon_location,beacon_level,location_code,company_id) values ('"+v_beacon_id+"','"+v_beacon_location+"','"+v_beacon_level+"','"+v_location_code+"','"+company_id+"')",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
    res.redirect(deployPath +'/location');
    

});

app.get(deployPath +'/location/delete/:id',isAuthenticated,function(req,res,next){
    
     var location_id = req.params.id;
   
    con.query("DELETE from location where location_id = '"+location_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
    
    res.redirect(deployPath +'/location');
    

});

app.get(deployPath +'/location/edit/:id',isAuthenticated,function(req,res,next){
    var location_id = req.params.id;
    con.query("SELECT * FROM location where location_id='"+location_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render('location_edit_en',{title:"Location",data:rows});
            }
            else{
                res.render('location_edit',{title:"Location",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

app.post(deployPath +'/location/edit/:id',isAuthenticated,function(req,res,next){
    var location_id = req.params.id;
    v_beacon_id = req.sanitize( 'beacon_id' ).escape(); 
    v_beacon_location = req.sanitize( 'beacon_location' ).escape();
    v_beacon_level = req.sanitize( 'beacon_level' ).escape();
    v_location_code = req.sanitize( 'location_code' ).escape();
    
    con.query("UPDATE location set beacon_id='"+v_beacon_id+"',beacon_location='"+v_beacon_location+"',beacon_level='"+v_beacon_level+"',location_code='"+v_location_code+"' where location_id='"+location_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           
            res.redirect(deployPath +'/location');
            
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    //res.render('employee_management',{title:"Employee Management"});
});

//----------------------------LOCATION----------------------------

app.get(deployPath +'/attendance',isAuthenticated,function(req,res,next){
    var route;
    var days = 31;
    var attendance;
    var routes;
    var employee;
    var employee_list;
    var attendance_list =[];
    var attendance_table = [];
    
    var path;
    
    
    var company_id = req.session.passport.user.company_id;
    
    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var dmonth = d.getMonth()+1;
    var orimonth = d.getMonth()+1;
    //var dmonth = 9;
    
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }
    

    
    
    con.query("SELECT employee_id,employee_name from employee where employee_level = '2' and company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query1 '+error);
       }
       else{
           employee = rows;
       }
   });
   
   con.query("SELECT * from route left join employee on route.employee_id = employee.employee_id left join company on employee.company_id = company.company_id where company.company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query3 '+error);
       }
       else{
           route = rows;
       }
   });
   
   
   
    con.query("SELECT * from path left join employee on path.employee_id = employee.employee_id left join company on company.company_id = employee.employee_id where company.company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query4 '+error);
       }
       else{
//           console.log('Successful query\n');
//           console.log(rows);
        path = rows;
        
        
           
       }
   });
    
    con.query("SELECT count(route_attendance) as attendance, sum(route_attendance) as total_attend,day(route_datetime) as day, route.employee_id,employee_name from route left join employee on route.employee_id = employee.employee_id where month(route_datetime) = '"+dmonth+"' and company_id='"+company_id+"' group by day(route_datetime),employee_id",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query2 '+error);
       }
       else{
           attendance = rows;
           
                for(var i=0;i<employee.length;i++){
                    if(attendance.length!==0){
                     for(var k=0;k<attendance.length;k++){
                         //console.log("emp="+employee[i].employee_id+" att_emp="+attendance[k].employee_id);
                         var emp = employee[i].employee_id.toString();
                         var att = attendance[k].employee_id.toString();
                        
                        
                         if(emp === att){
                             
                                //console.log("SELECT * from route where employee_id = '"+emp+"' and day(route_datetime) = '"+attendance[k].day+"' and month(route_datetime) = '"+orimonth+"'");
//                                con.query("SELECT * from route where employee_id = '"+emp+"' and day(route_datetime) = '"+attendance[k].day+"' and month(route_datetime) = '"+orimonth+"'",function(error,rows,fields){
//                                   if(!!error){
//                                       console.log('Error in the query12 '+error);
//                                   }
//                                   else{
//                                       console.log("in here");
//                                       routess = [];
//                                       routes = rows;
//                                       for(var j=0;j<routes.length;j++){
//                                       //console.log("routessz== "+routes);
//                                       route_list = {route_name : routes[j].route_name, employee_id : routes[j].employee_id,route_datetime : routes[j].route_datetime};
//                                       console.log("route_list-- "+JSON.stringify(route_list));
//                                       routess.push(route_list);
//                                       console.log("routess-- "+routess);
//                                    }
//
//                                   }
//                               });
                               
                               attendance_list.push(attendance[k]);
                              //console.log("in here2");
                             //console.log("attendace ="+JSON.stringify(attendance[k]));
                         }
                         
                         //console.log("route_list ="+JSON.stringify(route_list));
                         //console.log("attendace_list ="+JSON.stringify(attendance_list));
                         
                         employee_list = { employee_id:employee[i].employee_id,employee_name:employee[i].employee_name,emp_attendance:attendance_list};

                         //console.log("employee_list=="+JSON.stringify(employee_list));
                         //employee_list.push(attendance_list);
                       }
                    }
                    else{
                        
                         employee_list = { employee_id:employee[i].employee_id,employee_name:employee[i].employee_name,emp_attendance:0};

                        
                    }
                     attendance_list = [];
                     attendance_table.push(employee_list);
                 }
            //console.log("tavble=="+JSON.stringify(attendance_table));

            if(req.session.language === 'en'){
                    //console.log("attendance_table== "+attendance_table);
                    res.render('attendance_en',{title:"Attendance",data:path,route:route,days:days,attendance:attendance_table,month:dmonth});
                }
                else{
                    console.log("attendance_table== "+attendance_table);
                    res.render('attendance',{title:"Attendance",data:path,route:route,days:days,attendance:attendance_table,month:dmonth});
                }
            
       }
   });
   
    
    //res.render('attendance',{title:"Attendance"});
});

app.post(deployPath +'/attendance',isAuthenticated,function(req,res,next){
    
    months = req.sanitize( 'month_attendance' ).escape(); 
    //var months = req.params.month;
    var days;
    console.log("month =="+months);
    
    if(months === '01'){
        days = 31;
    }
    else if(months === '02'){
        days = 28;
    }
    else if(months === '03'){
        days = 31;
    }
    else if(months === '04'){
        days = 30;
    }
    else if(months === '05'){
        days = 31;
    }
    else if(months === '06'){
        days = 30;
    }
    else if(months === '07'){
        days = 31;
    }
    else if(months === '08'){
        days = 31;
    }
    else if(months === '09'){
        days = 30;
    }
    else if(months === '10'){
        days = 31;
    }
    else if(months === '11'){
        days = 30;
    }
    else if(months === '12'){
        days = 31;
    }
    
    var dmonth = months;
    //var dmonth = 9;
    if(dmonth === '01' || dmonth === 01){
         dmonth = '1';
     }
     else if(dmonth === '02' || dmonth === 02){
         dmonth = '2';
     }
     else if(dmonth === '03' || dmonth === 03){
         dmonth = '3';
     }
     else if(dmonth === '04' || dmonth === 04){
         dmonth = '4';
     }
     else if(dmonth === '05' || dmonth === 05){
         dmonth = '5';
     }
     else if(dmonth === '06' || dmonth === 06){
         dmonth = '6';
     }
     else if(dmonth === '07' || dmonth === 07){
         dmonth = '7';
     }
     else if(dmonth === '08' || dmonth === 08){
         dmonth = '8';
     }
     else if(dmonth === '09' || dmonth === 09){
         dmonth = '9';
     }
     else if(dmonth === '10' || dmonth === 10){
         dmonth = '10';
     }
     else if(dmonth === '11' || dmonth === 11){
         dmonth = '11';
     }
     else if(dmonth === '12' || dmonth === 12){
         dmonth = '12';
     }
     
    
    console.log("in 1");
//    console.log("days==="+days);
//    console.log("render finish");
//    res.redirect('/login');

    var company_id = req.session.passport.user.company_id;

    var route;
    var attendance;
    var employee;
    var employee_list;
    var attendance_list =[];
    var attendance_table = [];
    
    
    con.query("SELECT employee_id,employee_name from employee where employee_level = '2' and company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           employee = rows;
           
           con.query("SELECT count(route_attendance) as attendance, sum(route_attendance) as total_attend,day(route_datetime) as day, route.employee_id,employee_name from route left join employee on route.employee_id = employee.employee_id where month(route_datetime) = '"+dmonth+"' and company_id='"+company_id+"' group by day(route_datetime),employee_id",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                attendance = rows;

                for(var i=0;i<employee.length;i++){
                    if(attendance.length!==0){
                     for(var k=0;k<attendance.length;k++){
                         //console.log("emp="+employee[i].employee_id+" att_emp="+attendance[k].employee_id);
                         var emp = employee[i].employee_id.toString();
                         var att = attendance[k].employee_id.toString();
                         if(emp === att){
                             attendance_list.push(attendance[k]);
                             //console.log("attendace ="+JSON.stringify(attendance[k]));
                         }
                         //console.log("attendace_list ="+JSON.stringify(attendance_list));
                         employee_list = { employee_id:employee[i].employee_id,employee_name:employee[i].employee_name,emp_attendance:attendance_list};

                         //employee_list.push(attendance_list);
                       }
                    }
                    else{
                        
                         employee_list = { employee_id:employee[i].employee_id,employee_name:employee[i].employee_name,emp_attendance:0};

                        
                    }
                     attendance_list = [];
                     attendance_table.push(employee_list);
                 }
                 //console.log("tavble=="+JSON.stringify(attendance_table));
                 
                  if(req.session.language === 'en'){
                        res.render('attendance_en',{title:"Attendance",days:days,attendance:attendance_table,month:months});
                    }
                    else{
                        res.render('attendance',{title:"Attendance",days:days,attendance:attendance_table,month:months});
                    }
                 
            }
        });
       }
   });
    //console.log("in 2+ "+employee);
//    con.query("SELECT count(route_attendance) as attendance, sum(route_attendance) as total_attend,day(route_datetime) as day, employee_id from route where month(route_datetime) = '"+months+"'group by day(route_datetime),employee_id",function(error,rows,fields){
//       if(!!error){
//           console.log('Error in the query '+error);
//       }
//       else{
//           attendance = rows;
//           
//           for(var i=0;i<employee.length;i++){
//                for(var k=0;k<attendance.length;k++){
//                    //console.log("emp="+employee[i].employee_id+" att_emp="+attendance[k].employee_id);
//                    var emp = employee[i].employee_id.toString();
//                    var att = attendance[k].employee_id.toString();
//                    if(emp === att){
//                        attendance_list.push(attendance[k]);
//                        console.log("attendace ="+JSON.stringify(attendance[k]));
//                    }
//                    //console.log("attendace_list ="+JSON.stringify(attendance_list));
//                    employee_list = { employee_id:employee[i].employee_id.toString(),emp_attendance:attendance_list};
//                    
//                    //employee_list.push(attendance_list);
//                }
//                attendance_list = [];
//                attendance_table.push(employee_list);
//            }
//            //console.log("tavble=="+JSON.stringify(attendance_table));
//            
//       }
//   });
   
//    con.query("SELECT * from route",function(error,rows,fields){
//       if(!!error){
//           console.log('Error in the query '+error);
//       }
//       else{
//           route = rows;
//       }
//   });
//   
//   
//   
//    con.query("SELECT * from path",function(error,rows,fields){
//       if(!!error){
//           console.log('Error in the query '+error);
//       }
//       else{
////           console.log('Successful query\n');
////           console.log(rows);
//        console.log("in 2+ "+JSON.stringify(days));
//        console.log("in 3+ "+JSON.stringify(attendance_table));
//        console.log("in 4+ "+JSON.stringify(rows));
//        console.log("in 5+ "+JSON.stringify(route));
//        console.log("in 6+ "+JSON.stringify(months));
////        if(req.session.language === 'en'){
////            res.render('attendance_en',{title:"Attendance",data:rows,route:route,days:days,attendance:attendance_table,month:months});
////        }
////        else{
////            res.render('attendance',{title:"Attendance",data:rows,route:route,days:days,attendance:attendance_table,month:months});
////        }
//           
//       }
//   });
    
    
    //res.render('/',{title:"Attendance"});
});

app.get(deployPath +'/show_route/:emp_id-:day-:month',isAuthenticated,function(req,res,next){
    
     var emp_id= req.params.emp_id;
     var day= req.params.day;
     var month= req.params.month;
     var dmonth;
     
     if(month === '01' || month === 01){
         dmonth = '1';
     }
     else if(month === '02' || month === 02){
         dmonth = '2';
     }
     else if(month === '03' || month === 03){
         dmonth = '3';
     }
     else if(month === '04' || month === 04){
         dmonth = '4';
     }
     else if(month === '05' || month === 05){
         dmonth = '5';
     }
     else if(month === '06' || month === 06){
         dmonth = '6';
     }
     else if(month === '07' || month === 07){
         dmonth = '7';
     }
     else if(month === '08' || month === 08){
         dmonth = '8';
     }
     else if(month === '09' || month === 09){
         dmonth = '9';
     }
     else if(month === '10' || month === 10){
         dmonth = '10';
     }
     else if(month === '11' || month === 11){
         dmonth = '11';
     }
     else if(month === '12' || month === 12){
         dmonth = '12';
     }
     
   
    con.query("SELECT * from route left join employee on route.employee_id = employee.employee_id where route.employee_id = '"+emp_id+"' and day(route_datetime) = '"+day+"' and month(route_datetime) = '"+dmonth+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query routeadd='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    if(req.session.language === 'en'){
                       res.render('show_route_en',{title:"Show Route",data:rows});
                   }
                   else{
                       res.render('show_route',{title:"Show Route",data:rows});
                   }
                     
                }
            });
    
    
    

});


app.get(deployPath +'/login',function(req,res,next){
    res.render('login',{title:"Login"});
});

//----------------------------PROFILE----------------------------
//app.get('/profile',function(req,res,next){
//    res.render('profile',{title:"Profile"});
//});

app.get(deployPath +'/profile/:users_id',isAuthenticated,function(req,res){
    var users_id = req.params.users_id;
    var company_id = req.session.passport.user.company_id;
    var user;
    con.query("SELECT * FROM employee left join category on employee.category_id = category.category_id WHERE employee_id = ?",[users_id],function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           user = rows;
           con.query("SELECT * FROM category where company_id = '"+company_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                    }
                    else{
                        //console.log('Successful query\n');
                        //console.log(rows);
                        if(req.session.language === 'en'){
                            res.render('profile_en',{title:"Profile",data:user,category:rows});
                        }
                        else{
                            res.render('profile',{title:"Profile",data:user,category:rows});
                        }

                    }
                }); 
           
           
       }
   }); 
});

app.post(deployPath +'/profile/update',isAuthenticated,function(req,res){
    //console.log("in heeee");
//        var users_id = req.params.users_id;
        v_emp_id = req.sanitize( 'emp_id' );
        v_name = req.sanitize( 'name' ); 
        v_motto = req.sanitize( 'motto' );
        v_sim_card = req.sanitize( 'sim_card' );
        v_email = req.sanitize( 'email' ).escape();
        v_password = req.sanitize( 'password' ).escape();
        v_category = req.sanitize( 'category' );
        //console.log("v_category---"+v_category);
 
        
   con.query("Update employee SET employee_name = '"+v_name+"',employee_motto = '"+v_motto+"',employee_phone_no = '"+v_sim_card+"',employee_email = '"+v_email+"',employee_password = '"+v_password+"',category_id = '"+v_category+"' where employee_id = '"+v_emp_id+"'",function(error,rows,fields){
            if(error)
                {
                    console.log('Error in the query '+error);
                }else{
                    //req.flash('msg_info', 'Update profile success'); 
                    //res.redirect(deployPath +'/profile/'+v_emp_id);
                    res.redirect(deployPath +'/employee_management');
                }     
   }); 
});

app.post(deployPath +'/profile/pic',isAuthenticated,function(req,res){
    
    upload_emp_image(req,res,function(err) {
        v_emp_id = req.sanitize('emp_id');
       
        if(err) {
            return res.end("Error uploading file."+err);
        }
//        res.end("File is uploaded."+req.file.path);
        filepath = req.file.path;
        filepath = filepath.substr(7);
        
        
        con.query("Update employee SET employee_image='uploads/"+filepath+"' WHERE employee_id ="+v_emp_id,function(error,rows,fields){
            if(error)
                {
                    var errors_detail  = ("Error Insert : %s ",error );
                    console.log(errors_detail);
                    //req.flash('msg_error', errors_detail); 
                    res.redirect(deployPath +'/profile/'+v_emp_id);
                }else{
                    //req.flash('msg_info', 'Add gateway success'); 
                    res.redirect(deployPath +'/profile/'+v_emp_id);
                }     
      }); 
    });      
});

//----------------------------PROFILE----------------------------

app.get(deployPath +'/tracking',isAuthenticated,function(req,res,next){
    
    var employee_level = req.session.passport.user.employee_level;
    
    if(employee_level === '0'){
        res.redirect('/');
    }
    else if(employee_level === '2'){
        res.redirect('/');
    }

    var company_id = req.session.passport.user.company_id;

        var d = createDateAsUTC(new Date());
    //    d.setMinutes(d.getMinutes()+480);
        d.setMinutes(d.getMinutes()-480);
        var ddate = d.getDate();
        var dmonth = d.getMonth()+1;
        var dyear = d.getFullYear();
        var dhour = d.getHours();
        var dminutes = d.getMinutes();
        var dseconds = d.getSeconds();
        var d_date = d.getDate();
        var d_month = d.getMonth()+1;;

        if(ddate < 10){
            ddate = "0"+ddate;
        }
        if(dmonth < 10){
            dmonth = "0"+dmonth;
        }

        if(dhour < 10){
            dhour = "0"+dhour;
        }
        if(dminutes < 10){
            dminutes = "0"+dminutes;
        }
        if(dseconds < 10){
            dseconds = "0"+dseconds;
        }

        var newdate;
        newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;

        var employee,floor_plan,company,maps,region,group,category;
        var floors_id = [];
        var region_list = [];
        var building_list = [];
        var building_list_b = [];
        var group_list = [];
        var group_list_b = [];
        var category_list = [];
        var category_list_b = [];
        var employee_list = [];
        
        var region_list_a = [];
        var building_list_a = [];
        var building_list_temp_a = [];
        var group_list_a = [];
        var group_list_temp_a = [];
        var category_list_a = [];
        var category_list_temp_a = [];
        var employee_list_a = [];
        
        var floors,building;

        con.query("SELECT employee_id,employee_name,employee_image,category_id, employee_phone_no, employee_location, employee_time,employee_gps from employee left join company on employee.company_id = company.company_id where employee_level = '2' and company.company_id = '"+company_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query '+error);
           }
           else{
    //           console.log('Successful query\n');
    //           console.log(rows);
               employee = rows;
               
               con.query("SELECT * from building where company_id = '"+company_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                    }
                    else{
             //           console.log('Successful query\n');
             //           console.log(rows);
                        company = rows;
                        building = rows;
                        
                        con.query("SELECT * from map where company_id='"+company_id+"'",function(error,rows,fields){
                            if(!!error){
                                console.log('Error in the query '+error);
                            }
                            else{
                                if(rows.length === 0){

                                    con.query("INSERT INTO map(map_string,company_id) values ('','"+company_id+"')",function(error,rows,fields){
                                     if(!!error){
                                         console.log('Error in the query '+error);
                                     }
                                     else{
                                         con.query("SELECT * from map where company_id='"+company_id+"'",function(error,rows,fields){
                                             if(!!error){
                                                 console.log('Error in the query '+error);
                                             }
                                             else{
                                                   maps = rows;

                                            }
                                         });

                                    }
                                 });

                                }
                                else{
                                    maps = rows;
                                }
                                
                                
                                con.query("SELECT * FROM floor_plan where company_id='"+company_id+"'",function(error,rows,fields){
                                    if(!!error){
                                        console.log('Error in the query'+error);
                                    }
                                    else{
                                        floor_plan = rows;
                                        for(var i=0;i<rows.length;i++){
                                            floors_id.push({floor_id:rows[i].floorplan_id});
                                        }
                                        floors = {floor:floors_id};
                             //           res.render('employee_management',{title:"Employee Management",data:rows});
                                        //console.log(building);
                                        
                                        con.query("SELECT * FROM region where company_id='"+company_id+"'",function(error,rows,fields){
                                            if(!!error){
                                                console.log('Error in the query'+error);
                                            }
                                            else{
                                                region = rows;
                                                
                                                con.query("SELECT * FROM group_table where company_id='"+company_id+"'",function(error,rows,fields){
                                                    if(!!error){
                                                        console.log('Error in the query'+error);
                                                    }
                                                    else{
                                                        group = rows;
                                                        
                                                        con.query("SELECT * FROM category where company_id='"+company_id+"'",function(error,rows,fields){
                                                            if(!!error){
                                                                console.log('Error in the query'+error);
                                                            }
                                                            else{
                                                                category = rows;
                                                                
                                                                
                                                                /*for(var j=0;j<region.length;j++){
                                                                    for(var k=0;k<building.length;k++){
                                                                        console.log("jjj=="+region[j].region_id);
                                                                        console.log("kkk=="+building[k].region_id);
                                                                        if(region[j].region_id == building[k].region_id){
                                                                            console.log("insideee");
                                                                            region_list.push(building_list);
                                                                        }
                                                                        
                                                                        
                                                                    }
                                                                    
                                                                }*/
                                                                
                                                                for(var j=0;j<category.length;j++){
                                                                    
                                                                    for(var k=0;k<employee.length;k++){
                                                                        //console.log("jjj=="+category[j].category_id);
                                                                        //console.log("kkk=="+employee[k].category_id);
                                                                        if(category[j].category_id == employee[k].category_id){
                                                                            //console.log("insideee");
                                                                            employee_list.push({employee_id:employee[k].employee_id,employee_name:employee[k].employee_name});
                                                                            employee_list_a.push({text:employee[k].employee_name,emp_id:employee[k].employee_id,emp_gps:employee[k].employee_gps,type:'employee'});
                                                                        }
                                                                       
                                                                    }
                                                                    category_list.push({category_id:category[j].category_id,group_id:category[j].group_id,employees:employee_list});
                                                                    category_list_a.push({text:category[j].category_name,nodes:employee_list_a});
                                                                    employee_list = [];
                                                                    employee_list_a = [];
                                                                }
                                                                
                                                                for(var j=0;j<group.length;j++){
                                                                    category_list_b = [];
                                                                    category_list_temp_a = [];
                                                                    for(var k=0;k<category_list.length;k++){
                                                                        //console.log("jjj2=="+group[j].group_id);
                                                                        //console.log("kkk2=="+category_list[k].group_id);
                                                                        if(group[j].group_id == category_list[k].group_id){
                                                                            //console.log("insideee2");
                                                                            category_list_b.push({category:category_list[k]});
                                                                            category_list_temp_a.push(category_list_a[k]);
                                                                        }
                                                                        
                                                                        
                                                                    }
                                                                    group_list.push({group_name:group[j].group_name,group_id:group[j].group_id,building_id:group[j].building_id,categories:category_list_b});
                                                                    group_list_a.push({text:group[j].group_name,nodes:category_list_temp_a});
                                                                    
                                                                }
                                                                
                                                                for(var j=0;j<building.length;j++){
                                                                    group_list_b = [];
                                                                    group_list_temp_a = [];
                                                                    for(var k=0;k<group_list.length;k++){
                                                                        //console.log("jjj3=="+building[j].building_id);
                                                                        //console.log("kkk3=="+group_list[k].building_id);
                                                                        if(building[j].building_id == group_list[k].building_id){
                                                                            //console.log("insideee3");
                                                                            group_list_b.push({group:group_list[k]});
                                                                            group_list_temp_a.push(group_list_a[k]);
                                                                        }
                                                                        
                                                                        
                                                                    }
                                                                    building_list.push({building_name:building[j].building_name,building_id:building[j].building_id,region_id:building[j].region_id,group_list:group_list_b});
                                                                    building_list_a.push({text:building[j].building_name,nodes:group_list_temp_a,type:'building',building_gps:building[j].building_location});
                                                                    
                                                                }
                                                                
                                                                for(var j=0;j<region.length;j++){
                                                                    building_list_b = [];
                                                                    building_list_temp_a = [];
                                                                    for(var k=0;k<building_list.length;k++){
                                                                        //console.log("jjj4=="+region[j].region_id);
                                                                        //console.log("kkk4=="+building_list[k].region_id);
                                                                        if(region[j].region_id == building_list[k].region_id){
                                                                            //console.log("insideee4");
                                                                            building_list_b.push({building:building_list[k]});
                                                                            building_list_temp_a.push(building_list_a[k]);
                                                                        }
                                                                        
                                                                        
                                                                    }
                                                                    region_list.push({region_name:region[j].region_name,region_id:region[j].region_id,group_list:building_list_b});
                                                                    region_list_a.push({text:region[j].region_name,nodes:building_list_temp_a});
                                                                    
                                                                }
                                                                
                                                                //console.log(JSON.stringify(region_list_a));
                                                                
                                                                
                                                                if(req.session.language === 'en'){
                                                                    res.render('tracking_en_4',{title:"Tracking",data:JSON.stringify(employee),company:JSON.stringify(company),employee:employee,floor_plan:floor_plan,floors:JSON.stringify(floors),maps:maps,building:building,region:region,group:group,category:category,sidelist:JSON.stringify(region_list_a)});
                                                                }
                                                                else{
                                                                    res.render('tracking_4',{title:"Tracking",data:JSON.stringify(employee),company:JSON.stringify(company),employee:employee,floor_plan:floor_plan,floors:JSON.stringify(floors),maps:maps,building:building,region:region,group:group,category:category,sidelist:JSON.stringify(region_list_a)});
                                                                }
                                                            }
                                                        });
                                                
                                                    }
                                                });
                                                
                                            }
                                        });

                                    }
                                });

                           }
                        });
                        
                        
                    }
                });
                
                
           }
       });
       
//       con.query("SELECT * from company where company_id = '"+company_id+"'",function(error,rows,fields){
//           if(!!error){
//               console.log('Error in the query '+error);
//           }
//           else{
//    //           console.log('Successful query\n');
//    //           console.log(rows);
//               company = rows;
//           }
//       });

        

       
       
   
       //"SELECT * from path where day(path_datetime) = '"+ddate+"' and month(path_datetime) = '"+dmonth+"' and year(path_datetime)='"+dyear+"'"

       
    
});

app.get(deployPath +'/tracking_indoor/:id',isAuthenticated,function(req,res,next){

    var company_id = req.session.passport.user.company_id;
    var building_id = req.params.id;
    var group,category,building;
    
    var building_list = [];
    var building_list_b = [];
    var group_list = [];
    var group_list_b = [];
    var category_list = [];
    var category_list_b = [];
    var employee_list = [];


    var building_list_a = [];
    var building_list_temp_a = [];
    var group_list_a = [];
    var group_list_temp_a = [];
    var category_list_a = [];
    var category_list_temp_a = [];
    var employee_list_a = [];

        var d = createDateAsUTC(new Date());
    //    d.setMinutes(d.getMinutes()+480);
        d.setMinutes(d.getMinutes()-480);
        var ddate = d.getDate();
        var dmonth = d.getMonth()+1;
        var dyear = d.getFullYear();
        var dhour = d.getHours();
        var dminutes = d.getMinutes();
        var dseconds = d.getSeconds();
        var d_date = d.getDate();
        var d_month = d.getMonth()+1;;

        if(ddate < 10){
            ddate = "0"+ddate;
        }
        if(dmonth < 10){
            dmonth = "0"+dmonth;
        }

        if(dhour < 10){
            dhour = "0"+dhour;
        }
        if(dminutes < 10){
            dminutes = "0"+dminutes;
        }
        if(dseconds < 10){
            dseconds = "0"+dseconds;
        }

        var newdate;
        newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;

        var employee,floor_plan,company,maps;
        var floors_id = [];
        var floors;
        var markers = [];

        con.query("SELECT employee_id,employee_name,employee_image,category_id, employee_phone_no, employee_location, employee_time,employee_gps from employee left join company on employee.company_id = company.company_id where employee_level = '2' and company.company_id = '"+company_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query '+error);
           }
           else{
    //           console.log('Successful query\n');
    //           console.log(rows);
               employee = rows;
               
               con.query("SELECT * from company where company_id = '"+company_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                    }
                    else{
             //           console.log('Successful query\n');
             //           console.log(rows);
                        company = rows;
                        
                        con.query("SELECT * from map where company_id='"+company_id+"'",function(error,rows,fields){
                            if(!!error){
                                console.log('Error in the query '+error);
                            }
                            else{
                                if(rows.length === 0){

                                    con.query("INSERT INTO map(map_string,company_id) values ('','"+company_id+"')",function(error,rows,fields){
                                     if(!!error){
                                         console.log('Error in the query '+error);
                                     }
                                     else{
                                         con.query("SELECT * from map where company_id='"+company_id+"'",function(error,rows,fields){
                                             if(!!error){
                                                 console.log('Error in the query '+error);
                                             }
                                             else{
                                                     maps = rows;

                                            }
                                         });

                                    }
                                 });

                                }
                                else{
                                    maps = rows;
                                }
                                
                                
                                con.query("SELECT * FROM floor_plan where building_id='"+building_id+"' ",function(error,rows,fields){
                                    if(!!error){
                                        console.log('Error in the query'+error);
                                    }
                                    else{
                                        floor_plan = rows;
                                        for(var i=0;i<rows.length;i++){
                                            floors_id.push({floor_id:rows[i].floorplan_id});
                                            
                                            var marker = JSON.parse(rows[i].markers);
                                            for(var jk=0;jk<marker.length;jk++){
                                                markers.push({mark:marker[jk].popup});
                                            }

                                        }
                                        floors = {floor:floors_id};
                                        console.log(markers);
                                        
                                        con.query("SELECT * FROM group_table where company_id='"+company_id+"'",function(error,rows,fields){
                                             if(!!error){
                                                 console.log('Error in the query '+error);
                                             }
                                             else{
                                                     group = rows;
                                                     con.query("SELECT * FROM category where company_id='"+company_id+"'",function(error,rows,fields){
                                                        if(!!error){
                                                            console.log('Error in the query '+error);
                                                        }
                                                        else{
                                                                category = rows;
                                                                
                                                                con.query("SELECT * from building where building_id='"+building_id+"'",function(error,rows,fields){
                                                                        if(!!error){
                                                                            console.log('Error in the query '+error);
                                                                        }
                                                                        else{
                                                                              building = rows;
                                                                              
                                                                              for(var j=0;j<category.length;j++){
                                                                    
                                                                                    for(var k=0;k<employee.length;k++){
                                                                                        
                                                                                        if(category[j].category_id == employee[k].category_id){
                                                                                            
                                                                                            employee_list.push({employee_id:employee[k].employee_id,employee_name:employee[k].employee_name});
                                                                                            employee_list_a.push({text:employee[k].employee_name,emp_id:employee[k].employee_id,emp_gps:employee[k].employee_gps,type:'employee'});
                                                                                        }

                                                                                    }
                                                                                    category_list.push({category_id:category[j].category_id,group_id:category[j].group_id,employees:employee_list});
                                                                                    category_list_a.push({text:category[j].category_name,nodes:employee_list_a});
                                                                                    employee_list = [];
                                                                                    employee_list_a = [];
                                                                                }

                                                                                for(var j=0;j<group.length;j++){
                                                                                    category_list_b = [];
                                                                                    category_list_temp_a = [];
                                                                                    for(var k=0;k<category_list.length;k++){
                                                                                        
                                                                                        if(group[j].group_id == category_list[k].group_id){
                                                                                            
                                                                                            category_list_b.push({category:category_list[k]});
                                                                                            category_list_temp_a.push(category_list_a[k]);
                                                                                        }


                                                                                    }
                                                                                    group_list.push({group_name:group[j].group_name,group_id:group[j].group_id,building_id:group[j].building_id,categories:category_list_b});
                                                                                    group_list_a.push({text:group[j].group_name,nodes:category_list_temp_a});

                                                                                }

                                                                                for(var j=0;j<building.length;j++){
                                                                                    group_list_b = [];
                                                                                    group_list_temp_a = [];
                                                                                    for(var k=0;k<group_list.length;k++){
                                                                                        
                                                                                        if(building[j].building_id == group_list[k].building_id){
                                                                                            
                                                                                            group_list_b.push({group:group_list[k]});
                                                                                            group_list_temp_a.push(group_list_a[k]);
                                                                                        }


                                                                                    }
                                                                                    building_list.push({building_name:building[j].building_name,building_id:building[j].building_id,region_id:building[j].region_id,group_list:group_list_b});
                                                                                    building_list_a.push({text:building[j].building_name,nodes:group_list_temp_a,type:'building',building_gps:building[j].building_location});

                                                                                }

                                                                                if(req.session.language === 'en'){
                                                                                    res.render('tracking_en_4_indoor',{title:"Tracking",data:JSON.stringify(employee),company:JSON.stringify(company),employee:employee,floor_plan:floor_plan,floors:JSON.stringify(floors),maps:maps,markers:markers,sidelist:JSON.stringify(building_list_a)});
                                                                                }
                                                                                else{
                                                                                    res.render('tracking_4_indoor',{title:"Tracking",data:JSON.stringify(employee),company:JSON.stringify(company),employee:employee,floor_plan:floor_plan,floors:JSON.stringify(floors),maps:maps,markers:markers,sidelist:JSON.stringify(building_list_a)});
                                                                                }

                                                                       }
                                                                    });
                                                                
                                                                

                                                       }
                                                    });

                                            }
                                         });
                                        
                                        
                             //           res.render('employee_management',{title:"Employee Management",data:rows});
                                         
                                    }
                                });

                           }
                        });
                        
                        
                    }
                });
                
                
           }
       });
       
       
       
       
   
       //"SELECT * from path where day(path_datetime) = '"+ddate+"' and month(path_datetime) = '"+dmonth+"' and year(path_datetime)='"+dyear+"'"

       
    
});

app.get(deployPath +'/tracking2',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;

        var d = createDateAsUTC(new Date());
    //    d.setMinutes(d.getMinutes()+480);
        d.setMinutes(d.getMinutes()-480);
        var ddate = d.getDate();
        var dmonth = d.getMonth()+1;
        var dyear = d.getFullYear();
        var dhour = d.getHours();
        var dminutes = d.getMinutes();
        var dseconds = d.getSeconds();
        var d_date = d.getDate();
        var d_month = d.getMonth()+1;;

        if(ddate < 10){
            ddate = "0"+ddate;
        }
        if(dmonth < 10){
            dmonth = "0"+dmonth;
        }

        if(dhour < 10){
            dhour = "0"+dhour;
        }
        if(dminutes < 10){
            dminutes = "0"+dminutes;
        }
        if(dseconds < 10){
            dseconds = "0"+dseconds;
        }

        var newdate;
        newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;

        var employee,floor_plan,company;
        var floors_id = [];
        var floors;

        con.query("SELECT employee_id,employee_name, employee_phone_no, employee_location, employee_time,employee_gps from employee left join company on employee.company_id = company.company_id where employee_level = '2' and company.company_id = '"+company_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query '+error);
           }
           else{
    //           console.log('Successful query\n');
    //           console.log(rows);
               employee = rows;
           }
       });
       
        con.query("SELECT * from company where company_id = '"+company_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query '+error);
           }
           else{
    //           console.log('Successful query\n');
    //           console.log(rows);
               company = rows;
           }
       });

       //"SELECT * from path where day(path_datetime) = '"+ddate+"' and month(path_datetime) = '"+dmonth+"' and year(path_datetime)='"+dyear+"'"

       con.query("SELECT * FROM floor_plan where company_id='"+company_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query'+error);
           }
           else{
               floor_plan = rows;
               for(var i=0;i<rows.length;i++){
                   floors_id.push({floor_id:rows[i].floorplan_id});
               }
               floors = {floor:floors_id};
    //           res.render('employee_management',{title:"Employee Management",data:rows});
                if(req.session.language === 'en'){
                    res.render('tracking_en_2',{title:"Tracking",data:JSON.stringify(employee),company:JSON.stringify(company),employee:employee,floor_plan:floor_plan,floors:JSON.stringify(floors)});
                }
                else{
                    res.render('tracking_en_2',{title:"Tracking",data:JSON.stringify(employee),company:JSON.stringify(company),employee:employee,floor_plan:floor_plan,floors:JSON.stringify(floors)});
                }
           }
       });
    
});

app.get(deployPath +'/path_playback_2',isAuthenticated,function(req,res,next){
    
    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();
    var d_date = d.getDate();
    var d_month = d.getMonth()+1;;

    if(ddate < 10){
        ddate = "0"+ddate;
    }
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }

    if(dhour < 10){
        dhour = "0"+dhour;
    }
    if(dminutes < 10){
        dminutes = "0"+dminutes;
    }
    if(dseconds < 10){
        dseconds = "0"+dseconds;
    }
    
    var newdate;
    newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    
    var employee;
    
    con.query("SELECT employee_id,employee_name, employee_phone_no, employee_location, employee_time from employee where employee_level != '1'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
//           console.log('Successful query\n');
//           console.log(rows);
           employee = rows;
       }
   });
   
   //"SELECT * from path where day(path_datetime) = '"+ddate+"' and month(path_datetime) = '"+dmonth+"' and year(path_datetime)='"+dyear+"'"
   
    con.query("SELECT * from path",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
//           console.log('Successful query\n');
//           console.log(rows);
            if(req.session.language === 'en'){
                res.render('path_playback_en',{title:"Path Playback",data:rows,employee:employee});
            }
            else{
                res.render('path_playback',{title:"Path Playback",data:rows,employee:employee});
            }
           
       }
   });

});

app.get(deployPath +'/map_management',isAuthenticated,function(req,res,next){

var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * from map where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           if(rows.length === 0){
               
               con.query("INSERT INTO map(map_string,company_id) values ('','"+company_id+"')",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query '+error);
                }
                else{
                    con.query("SELECT * from map where company_id='"+company_id+"'",function(error,rows,fields){
                        if(!!error){
                            console.log('Error in the query '+error);
                        }
                        else{
                                if(req.session.language === 'en'){
                                        res.render('map_management_en',{title:"Map Management",data:rows});
                                    }
                                    else{
                                        res.render('map_management',{title:"Map Management",data:rows});
                                    }

                       }
                    });

               }
            });
               
           }
           else{
               if(req.session.language === 'en'){
 
                    res.render('map_management_en',{title:"Map Management",data:rows});
                }
                else{
                    res.render('map_management',{title:"Map Management",data:rows});
                }
           }
           
      }
   });
   
});

app.get(deployPath +'/geofencing',isAuthenticated,function(req,res,next){
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * from map where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           if(rows.length === 0){
               
               con.query("INSERT INTO map(map_string,company_id) values ('','"+company_id+"')",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query '+error);
                }
                else{
                    con.query("SELECT * from map where company_id='"+company_id+"'",function(error,rows,fields){
                        if(!!error){
                            console.log('Error in the query '+error);
                        }
                        else{
                                if(req.session.language === 'en'){
                                    res.render('geofencing_en',{title:"Geofencing",data:rows});
                                    }
                                    else{
                                        res.render('geofencing',{title:"Geofencing",data:rows});
                                    }

                       }
                    });
                    
                    
               }
            });
               
           }
           else{
               if(req.session.language === 'en'){
                    res.render('geofencing_en',{title:"Geofencing",data:rows});
                    }
                    else{
                        res.render('geofencing',{title:"Geofencing",data:rows});
                    }
           }
           
      }
   });
   
   
    
    
});

app.get(deployPath +'/test_mobile',isAuthenticated,function(req,res,next){
    
    var requestData = {get_route_data:{emp_id:"1"}};

    request({
            url: "http://localhost:3000/api/v1/send_route",
            method: "POST",
            json: true,   // <--Very important!!!
            body:requestData
        }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        //var json_string = JSON.parse(body);
        console.log("body--"+body);
        //res.status(200).send(body);
     }
     else{
         console.log("error22="+error);
     }
    });
    
    
    setInterval(function(){

        var requestData = {send_location_data:{emp_id:"1",location:"B0:B4:48:DC:BD:FB"}};

        request({
                url: "http://localhost:3000/api/v1/send_location",
                method: "POST",
                json: true,   // <--Very important!!!
                body:requestData
            }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //var json_string = JSON.parse(body);
            //res.status(200).send(body);
            console.log("body-11--"+body);
         }
         else{
             console.log("error212="+error);
         }
        });
       
       }, 2000);
});

app.get(deployPath +'/test_time',isAuthenticated,function(req,res,next){
    
    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();

    if(ddate < 10){
        ddate = "0"+ddate;
    }
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }

    if(dhour < 10){
        dhour = "0"+dhour;
    }
    if(dminutes < 10){
        dminutes = "0"+dminutes;
    }
    if(dseconds < 10){
        dseconds = "0"+dseconds;
    }
    
    var newdate;
    newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    
    
    var dd = createDateAsUTC(new Date());
    //d.setMinutes(d.getMinutes()-480);
    //dd.setMinutes(dd.getMinutes()+480);
    var dddate = dd.getDate();
    var ddmonth = dd.getMonth()+1;
    var ddyear = dd.getFullYear();
    var ddhour = dd.getHours();
    var ddminutes = dd.getMinutes();
    var ddseconds = dd.getSeconds();

    if(dddate < 10){
        dddate = "0"+dddate;
    }
    if(ddmonth < 10){
        ddmonth = "0"+ddmonth;
    }

    if(ddhour < 10){
        ddhour = "0"+ddhour;
    }
    if(ddminutes < 10){
        ddminutes = "0"+ddminutes;
    }
    if(ddseconds < 10){
        ddseconds = "0"+ddseconds;
    }
    
    var newddate;
    newddate = ddyear+"-"+ddmonth+"-"+dddate+" "+ddhour+":"+ddminutes+":"+ddseconds;
    
    
    var dk = createDateAsUTC(new Date());
    //d.setMinutes(d.getMinutes()-480);
//    dk.setMinutes(dk.getMinutes()+ 480);
    var dkdate = dk.getDate();
    var dkmonth = dk.getMonth()+1;
    var dkyear = dk.getFullYear();
    var dkhour = dk.getHours();
    var dkminutes = dk.getMinutes();
    var dkseconds = dk.getSeconds();

    if(dkdate < 10){
        dkdate = "0"+dkdate;
    }
    if(dkmonth < 10){
        dkmonth = "0"+dkmonth;
    }

    if(dkhour < 10){
        dkhour = "0"+dkhour;
    }
    if(dkminutes < 10){
        dkminutes = "0"+dkminutes;
    }
    if(dkseconds < 10){
        dkseconds = "0"+dkseconds;
    }
    
    var newdkate;
    newdkate = dkyear+"-"+dkmonth+"-"+dkdate+" "+dkhour+":"+dkminutes+":"+dkseconds;
    
    
    var datasend = {data:"good",time1:newdate,time2:newddate,time3:newdkate};
    res.status(200).send(datasend);
    
    
});

app.get(deployPath +'/mapmap',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();
    var d_date = d.getDate();
    var d_month = d.getMonth()+1;;

    if(ddate < 10){
        ddate = "0"+ddate;
    }
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }

    if(dhour < 10){
        dhour = "0"+dhour;
    }
    if(dminutes < 10){
        dminutes = "0"+dminutes;
    }
    if(dseconds < 10){
        dseconds = "0"+dseconds;
    }
    
    var newdate;
    newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    
    var employee,floor_plan;
    
    con.query("SELECT employee_id,employee_name, employee_phone_no, employee_location, employee_time from employee left join company on employee.company_id = company.company_id where employee_level = '2' and company.company_id = '"+company_id+"' ",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
//           console.log('Successful query\n');
//           console.log(rows);
           employee = rows;
       }
   });
   
   //"SELECT * from path where day(path_datetime) = '"+ddate+"' and month(path_datetime) = '"+dmonth+"' and year(path_datetime)='"+dyear+"'"
   
   con.query("SELECT * FROM floor_plan where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query'+error);
       }
       else{
           floor_plan = rows;
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   });
   
    con.query("SELECT * from path left join employee on path.employee_id = employee.employee_id left join company on employee.company_id = company.company_id where company.company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
//           console.log('Successful query\n');
//           console.log(rows);
            if(req.session.language === 'en'){
                res.render('mapmap',{title:"Path Playback",data:rows,employee:employee,floor_plan:floor_plan});
            }
            else{
                res.render('mapmap',{title:"Path Playback",data:rows,employee:employee,floor_plan:floor_plan});
            }
           
       }
   });

});

app.get(deployPath +'/path_playback',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    var group,category,building,history;
    
    var building_list = [];
    var building_list_b = [];
    var group_list = [];
    var group_list_b = [];
    var category_list = [];
    var category_list_b = [];
    var employee_list = [];


    var building_list_a = [];
    var building_list_temp_a = [];
    var group_list_a = [];
    var group_list_temp_a = [];
    var category_list_a = [];
    var category_list_temp_a = [];
    var employee_list_a = [];
    
    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();
    var d_date = d.getDate();
    var d_month = d.getMonth()+1;;

    if(ddate < 10){
        ddate = "0"+ddate;
    }
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }

    if(dhour < 10){
        dhour = "0"+dhour;
    }
    if(dminutes < 10){
        dminutes = "0"+dminutes;
    }
    if(dseconds < 10){
        dseconds = "0"+dseconds;
    }
    
    var newdate;
    newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    
    var employee,floor_plan,company;
    var floors_id = [];
    var floors;
    
    con.query("SELECT employee_id,employee_name,employee_image,category_id, employee_phone_no, employee_location, employee_time,employee_gps from employee left join company on employee.company_id = company.company_id where employee_level = '2' and company.company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
//           console.log('Successful query\n');
//           console.log(rows);
           employee = rows;
           
           con.query("SELECT * FROM floor_plan where company_id='"+company_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query'+error);
                }
                else{
                    floor_plan = rows;
                    for(var i=0;i<rows.length;i++){
                            floors_id.push({floor_id:rows[i].floorplan_id});
                    }
                        floors = {floor:floors_id};
         //           res.render('employee_management',{title:"Employee Management",data:rows});
         
                    con.query("SELECT * from company where company_id = '"+company_id+"'",function(error,rows,fields){
                        if(!!error){
                            console.log('Error in the query '+error);
                        }
                        else{
                 //           console.log('Successful query\n');
                 //           console.log(rows);
                            company = rows;
                        }
                    });
                    
                    
                    con.query("SELECT * from history left join employee on history.employee_id = employee.employee_id left join company on employee.company_id = company.company_id where company.company_id = '"+company_id+"'",function(error,rows,fields){
                        if(!!error){
                            console.log('Error in the query '+error);
                        }
                        else{
                 //           console.log('Successful query\n');
                 //           console.log(rows);
                            history = rows;
                 
                            con.query("SELECT * FROM group_table where company_id='"+company_id+"'",function(error,rows,fields){
                                             if(!!error){
                                                 console.log('Error in the query '+error);
                                             }
                                             else{
                                                     group = rows;
                                                     con.query("SELECT * FROM category where company_id='"+company_id+"'",function(error,rows,fields){
                                                        if(!!error){
                                                            console.log('Error in the query '+error);
                                                        }
                                                        else{
                                                                category = rows;
                                                                
                                                                con.query("SELECT * from building where company_id='"+company_id+"'",function(error,rows,fields){
                                                                        if(!!error){
                                                                            console.log('Error in the query '+error);
                                                                        }
                                                                        else{
                                                                              building = rows;
                                                                              
                                                                              for(var j=0;j<category.length;j++){
                                                                    
                                                                                    for(var k=0;k<employee.length;k++){
                                                                                        
                                                                                        if(category[j].category_id == employee[k].category_id){
                                                                                            
                                                                                            employee_list.push({employee_id:employee[k].employee_id,employee_name:employee[k].employee_name});
                                                                                            employee_list_a.push({text:employee[k].employee_name,emp_id:employee[k].employee_id,emp_gps:employee[k].employee_gps,type:'employee'});
                                                                                        }

                                                                                    }
                                                                                    category_list.push({category_id:category[j].category_id,group_id:category[j].group_id,employees:employee_list});
                                                                                    category_list_a.push({text:category[j].category_name,nodes:employee_list_a});
                                                                                    employee_list = [];
                                                                                    employee_list_a = [];
                                                                                }

                                                                                for(var j=0;j<group.length;j++){
                                                                                    category_list_b = [];
                                                                                    category_list_temp_a = [];
                                                                                    for(var k=0;k<category_list.length;k++){
                                                                                        
                                                                                        if(group[j].group_id == category_list[k].group_id){
                                                                                            
                                                                                            category_list_b.push({category:category_list[k]});
                                                                                            category_list_temp_a.push(category_list_a[k]);
                                                                                        }


                                                                                    }
                                                                                    group_list.push({group_name:group[j].group_name,group_id:group[j].group_id,building_id:group[j].building_id,categories:category_list_b});
                                                                                    group_list_a.push({text:group[j].group_name,nodes:category_list_temp_a});

                                                                                }

                                                                                for(var j=0;j<building.length;j++){
                                                                                    group_list_b = [];
                                                                                    group_list_temp_a = [];
                                                                                    for(var k=0;k<group_list.length;k++){
                                                                                        
                                                                                        if(building[j].building_id == group_list[k].building_id){
                                                                                            
                                                                                            group_list_b.push({group:group_list[k]});
                                                                                            group_list_temp_a.push(group_list_a[k]);
                                                                                        }


                                                                                    }
                                                                                    building_list.push({building_name:building[j].building_name,building_id:building[j].building_id,region_id:building[j].region_id,group_list:group_list_b});
                                                                                    building_list_a.push({text:building[j].building_name,nodes:group_list_temp_a,type:'building',building_gps:building[j].building_location});

                                                                                }

                                                                                if(req.session.language === 'en'){
                                                                                        res.render('playback_indoor_en',{title:"Path Playback",data:JSON.stringify(history),company:JSON.stringify(company),employee:employee,floor_plan:floor_plan,floors:JSON.stringify(floors),sidelist:JSON.stringify(building_list_a)});
                                                                                    }
                                                                                    else{
                                                                                        res.render('playback_indoor',{title:"Path Playback",data:JSON.stringify(history),company:JSON.stringify(company),employee:employee,floor_plan:floor_plan,floors:JSON.stringify(floors),sidelist:JSON.stringify(building_list_a)});
                                                                                    }

                                                                       }
                                                                    });
                                                                
                                                                

                                                       }
                                                    });

                                            }
                                         });
                             

                        }
                    });
                    
                    
                }
            });
            
            
       }
   });
   
   //"SELECT * from path where day(path_datetime) = '"+ddate+"' and month(path_datetime) = '"+dmonth+"' and year(path_datetime)='"+dyear+"'"
   
   
   
   
   
    

});

app.get(deployPath +'/path_playback_outdoor',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();
    var d_date = d.getDate();
    var d_month = d.getMonth()+1;;

    if(ddate < 10){
        ddate = "0"+ddate;
    }
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }

    if(dhour < 10){
        dhour = "0"+dhour;
    }
    if(dminutes < 10){
        dminutes = "0"+dminutes;
    }
    if(dseconds < 10){
        dseconds = "0"+dseconds;
    }
    
    var newdate;
    newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    
    var employee,floor_plan,company,maps,region,group,category;
    var floors_id = [];
    var floors,maps;

    var region_list = [];
    var building_list = [];
    var building_list_b = [];
    var group_list = [];
    var group_list_b = [];
    var category_list = [];
    var category_list_b = [];
    var employee_list = [];

    var region_list_a = [];
    var building_list_a = [];
    var building_list_temp_a = [];
    var group_list_a = [];
    var group_list_temp_a = [];
    var category_list_a = [];
    var category_list_temp_a = [];
    var employee_list_a = [];
    
    con.query("SELECT employee_id,employee_name,employee_image,category_id, employee_phone_no, employee_location, employee_time,employee_gps from employee left join company on employee.company_id = company.company_id where employee_level = '2' and company.company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
//           console.log('Successful query\n');
//           console.log(rows);
           employee = rows;
           
           con.query("SELECT * FROM floor_plan where company_id='"+company_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query'+error);
                }
                else{
                    floor_plan = rows;
                    for(var i=0;i<rows.length;i++){
                            floors_id.push({floor_id:rows[i].floorplan_id});
                    }
                        floors = {floor:floors_id};
         //           res.render('employee_management',{title:"Employee Management",data:rows});
         
                    con.query("SELECT * from building where company_id = '"+company_id+"'",function(error,rows,fields){
                        if(!!error){
                            console.log('Error in the query '+error);
                        }
                        else{
                 //           console.log('Successful query\n');
                 //           console.log(rows);
                            company = rows;
                            building = rows;
                            
                            con.query("SELECT * from map where company_id='"+company_id+"'",function(error,rows,fields){
                            if(!!error){
                                console.log('Error in the query '+error);
                            }
                            else{
                                if(rows.length === 0){

                                    con.query("INSERT INTO map(map_string,company_id) values ('','"+company_id+"')",function(error,rows,fields){
                                     if(!!error){
                                         console.log('Error in the query '+error);
                                     }
                                     else{
                                         con.query("SELECT * from map where company_id='"+company_id+"'",function(error,rows,fields){
                                             if(!!error){
                                                 console.log('Error in the query '+error);
                                             }
                                             else{
                                                     maps = rows;

                                            }
                                         });

                                    }
                                 });

                                }
                                else{
                                    maps = rows;
                                }
                            
                            con.query("SELECT * from history_gps left join employee on history_gps.employee_id = employee.employee_id left join company on employee.company_id = company.company_id where company.company_id = '"+company_id+"' and history_gps.gps_loc != '4.9E-324,4.9E-324'",function(error,rows,fields){
                                if(!!error){
                                    console.log('Error in the query '+error);
                                }
                                else{
                                    console.log('Successful query\n');
                                    //console.log(rows);
                                    data = rows;
                                    
                                    con.query("SELECT * FROM region where company_id='"+company_id+"'",function(error,rows,fields){
                                            if(!!error){
                                                console.log('Error in the query'+error);
                                            }
                                            else{
                                                region = rows;
                                                
                                                con.query("SELECT * FROM group_table where company_id='"+company_id+"'",function(error,rows,fields){
                                                    if(!!error){
                                                        console.log('Error in the query'+error);
                                                    }
                                                    else{
                                                        group = rows;
                                                        
                                                        con.query("SELECT * FROM category where company_id='"+company_id+"'",function(error,rows,fields){
                                                            if(!!error){
                                                                console.log('Error in the query'+error);
                                                            }
                                                            else{
                                                                category = rows;
                                                                
                                                                
                                                                /*for(var j=0;j<region.length;j++){
                                                                    for(var k=0;k<building.length;k++){
                                                                        console.log("jjj=="+region[j].region_id);
                                                                        console.log("kkk=="+building[k].region_id);
                                                                        if(region[j].region_id == building[k].region_id){
                                                                            console.log("insideee");
                                                                            region_list.push(building_list);
                                                                        }
                                                                        
                                                                        
                                                                    }
                                                                    
                                                                }*/
                                                                
                                                                for(var j=0;j<category.length;j++){
                                                                    
                                                                    for(var k=0;k<employee.length;k++){
                                                                        //console.log("jjj=="+category[j].category_id);
                                                                        //console.log("kkk=="+employee[k].category_id);
                                                                        if(category[j].category_id == employee[k].category_id){
                                                                            //console.log("insideee");
                                                                            employee_list.push({employee_id:employee[k].employee_id,employee_name:employee[k].employee_name});
                                                                            employee_list_a.push({text:employee[k].employee_name,emp_id:employee[k].employee_id,emp_gps:employee[k].employee_gps,type:'employee'});
                                                                        }
                                                                       
                                                                    }
                                                                    category_list.push({category_id:category[j].category_id,group_id:category[j].group_id,employees:employee_list});
                                                                    category_list_a.push({text:category[j].category_name,nodes:employee_list_a});
                                                                    employee_list = [];
                                                                    employee_list_a = [];
                                                                }
                                                                
                                                                for(var j=0;j<group.length;j++){
                                                                    category_list_b = [];
                                                                    category_list_temp_a = [];
                                                                    for(var k=0;k<category_list.length;k++){
                                                                        //console.log("jjj2=="+group[j].group_id);
                                                                        //console.log("kkk2=="+category_list[k].group_id);
                                                                        if(group[j].group_id == category_list[k].group_id){
                                                                            //console.log("insideee2");
                                                                            category_list_b.push({category:category_list[k]});
                                                                            category_list_temp_a.push(category_list_a[k]);
                                                                        }
                                                                        
                                                                        
                                                                    }
                                                                    group_list.push({group_name:group[j].group_name,group_id:group[j].group_id,building_id:group[j].building_id,categories:category_list_b});
                                                                    group_list_a.push({text:group[j].group_name,nodes:category_list_temp_a});
                                                                    
                                                                }
                                                                
                                                                for(var j=0;j<building.length;j++){
                                                                    group_list_b = [];
                                                                    group_list_temp_a = [];
                                                                    for(var k=0;k<group_list.length;k++){
                                                                        //console.log("jjj3=="+building[j].building_id);
                                                                        //console.log("kkk3=="+group_list[k].building_id);
                                                                        if(building[j].building_id == group_list[k].building_id){
                                                                            //console.log("insideee3");
                                                                            group_list_b.push({group:group_list[k]});
                                                                            group_list_temp_a.push(group_list_a[k]);
                                                                        }
                                                                        
                                                                        
                                                                    }
                                                                    building_list.push({building_name:building[j].building_name,building_id:building[j].building_id,region_id:building[j].region_id,group_list:group_list_b});
                                                                    building_list_a.push({text:building[j].building_name,nodes:group_list_temp_a,type:'building',building_gps:building[j].building_location});
                                                                    
                                                                }
                                                                
                                                                for(var j=0;j<region.length;j++){
                                                                    building_list_b = [];
                                                                    building_list_temp_a = [];
                                                                    for(var k=0;k<building_list.length;k++){
                                                                        //console.log("jjj4=="+region[j].region_id);
                                                                        //console.log("kkk4=="+building_list[k].region_id);
                                                                        if(region[j].region_id == building_list[k].region_id){
                                                                            //console.log("insideee4");
                                                                            building_list_b.push({building:building_list[k]});
                                                                            building_list_temp_a.push(building_list_a[k]);
                                                                        }
                                                                        
                                                                        
                                                                    }
                                                                    region_list.push({region_name:region[j].region_name,region_id:region[j].region_id,group_list:building_list_b});
                                                                    region_list_a.push({text:region[j].region_name,nodes:building_list_temp_a});
                                                                    
                                                                }
                                                                
                                                                //console.log(JSON.stringify(region_list_a));
                                                                
                                                                
                                                                if(req.session.language === 'en'){
                                                                        res.render('playback_outdoor_en',{title:"Path Playback",data:JSON.stringify(data),company:JSON.stringify(company),employee:employee,floor_plan:floor_plan,floors:JSON.stringify(floors),maps:maps,building:building,region:region,group:group,category:category,sidelist:JSON.stringify(region_list_a)});
                                                                    }
                                                                    else{
                                                                        res.render('playback_outdoor',{title:"Path Playback",data:JSON.stringify(data),company:JSON.stringify(company),employee:employee,floor_plan:floor_plan,floors:JSON.stringify(floors),maps:maps,building:building,region:region,group:group,category:category,sidelist:JSON.stringify(region_list_a)});
                                                                    }
                                                            }
                                                        });
                                                
                                                    }
                                                });
                                                
                                            }
                                        });

                                }
                            });
                            
                        
                         }
                        });
                    }
                    });
                    
                    
                    
                }
            });
            
            
       }
   });
   
   //"SELECT * from path where day(path_datetime) = '"+ddate+"' and month(path_datetime) = '"+dmonth+"' and year(path_datetime)='"+dyear+"'"

});

//----------------------------FLOOR PLAN----------------------------

app.get(deployPath +'/floor_plan_list',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * FROM floor_plan where company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render(deployPath +'floor_plan_list_en',{title:"Floor Plan List",data:rows});
            }
            else{
                res.render(deployPath +'floor_plan_list',{title:"Floor Plan List",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    
    
});

app.get(deployPath +'/floor_plan',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * FROM building where company_id = '"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render(deployPath +'floor_plan_en',{title:"Floor Plan",data:rows});
            }
            else{
                res.render(deployPath +'floor_plan',{title:"Floor Plan",data:rows});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
   
    
});

app.post(deployPath +'/floor_plan/add',isAuthenticated,function(req,res,next){
    var company_id = req.session.passport.user.company_id;
    upload(req,res,function(err) {
        //console.log("get select from body ="+req.body.dept_code);
        v_floor_name = req.sanitize( 'floor_name' ).escape(); 
        v_building = req.sanitize( 'building' ); 
       
        //console.log("v_floor_name-- "+v_floor_name);
        if(err) {
            return res.end("Error uploading file."+err);
        }
//        res.end("File is uploaded."+req.file.path);
//        filepath = req.file.path;
        filepath = req.file.path;
        filepath = filepath.substr(7);
        //console.log("filepath-- "+filepath);
        //console.log("INSERT INTO floor_plan(floorplan_img,floor_name) VALUES ('"+filepath+"','"+v_floor_name+"')");
        
        con.query("INSERT INTO floor_plan(floorplan_img,floor_name,company_id,building_id) VALUES ('uploads/"+filepath+"','"+v_floor_name+"','"+company_id+"','"+v_building+"')",function(error,rows,fields){
            if(error)
                {
                    var errors_detail  = ("Error Insert : %s ",error ); 
                    console.log("Error Insert : %s ",errors_detail );
                    //req.flash('msg_error', errors_detail); 
                    res.redirect('/floor_plan');
                }else{
                    //req.flash('msg_info', 'Add floor plan success'); 
                    res.redirect('/floor_plan');
                }     
      }); 
    }); 
    
});

app.get(deployPath +'/floor_plan_detail/:id',isAuthenticated,function(req,res,next){
    
    var floorplan_id = req.params.id;
    var location;
    var company_id = req.session.passport.user.company_id;
    
    con.query("SELECT * FROM location where company_id='"+company_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           location = rows;
       }
            
   });
    
    con.query("SELECT * FROM floor_plan where floorplan_id='"+floorplan_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            if(req.session.language === 'en'){
                res.render(deployPath +'floor_plan_detail_en',{title:"Floor Plan Detail",data:rows,location:JSON.stringify(location)});
            }
            else{
                res.render(deployPath +'floor_plan_detail',{title:"Floor Plan Detail",data:rows,location:JSON.stringify(location)});
            }
//           res.render('employee_management',{title:"Employee Management",data:rows});
       }
   }); 
    
    
});

app.get(deployPath +'/floor_plan/delete/:id',isAuthenticated,function(req,res,next){
    
     var floorplan_id = req.params.id;
   
    con.query("DELETE from floor_plan where floorplan_id = '"+floorplan_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query='+error);
                }
                else{
//                    console.log('Successful query\n');
//                    console.log(rows);
                    //res.redirect('/route_management');
                }
            });
   
    res.redirect(deployPath +'/floor_plan_list');
    

});
 
 //----------------------------REST API-------------------------------------
 
app.get(deployPath +'/get_positioning',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;


        con.query("SELECT employee_id,employee_name, employee_phone_no, employee_location, employee_time,employee_gps from employee left join company on employee.company_id = company.company_id where employee_level = '2' and company.company_id = '"+company_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query '+error);
           }
           else{
    //           console.log('Successful query\n');
               //console.log(rows);
               employee = rows;
               res.status(200).send(employee);
               
           }
       });
    
    
});

app.get(deployPath +'/get_floorplan',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;


        con.query("SELECT * FROM floor_plan where company_id='"+company_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query '+error);
           }
           else{
    //           console.log('Successful query\n');
               //console.log(rows);
               res.status(200).send(rows);
               
           }
       });
    
    
});

app.get(deployPath +'/get_playback/:time1/:time2/:emp_id',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    var time1 = req.params.time1;
    var time2 = req.params.time2;
    var emp_id = req.params.emp_id;
    
        console.log("SELECT * FROM history_gps left join employee on history_gps.employee_id = employee.employee_id where path_datetime >= '"+time1+"' AND path_datetime <= '"+time2+"' AND history_gps.employee_id = '"+emp_id+"'");
        con.query("SELECT * FROM history_gps left join employee on history_gps.employee_id = employee.employee_id where path_datetime >= '"+time1+"' AND path_datetime <= '"+time2+"' AND history_gps.employee_id = '"+emp_id+"' and history_gps.gps_loc != '4.9E-324,4.9E-324'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query '+error);
           }
           else{
//               console.log('Successful query\n');
//               console.log(rows);
               res.status(200).send(rows);
               
           }
       });
    
    
});


app.get(deployPath +'/get_history/:time1/:time2/:emp_id',isAuthenticated,function(req,res,next){
    
    var company_id = req.session.passport.user.company_id;
    var time1 = req.params.time1;
    var time2 = req.params.time2;
    var emp_id = req.params.emp_id;

        console.log("SELECT * FROM history left join employee on history.employee_id = employee.employee_id where path_datetime >= '"+time1+"' AND path_datetime <= '"+time2+"' AND history.employee_id = '"+emp_id+"'");
        con.query("SELECT * FROM history left join employee on history.employee_id = employee.employee_id where path_datetime >= '"+time1+"' AND path_datetime <= '"+time2+"' AND history.employee_id = '"+emp_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query '+error);
           }
           else{
//               console.log('Successful query\n');
//               console.log(rows);
               res.status(200).send(rows);
               
           }
       });

});

app.get('/api/v1/get_login',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    var requestData = {
            send_login_data: {
              emp_login: "ymd_emp",
              emp_pass: "123"
             
            }
          };

    request({
            url: "http://localhost:3000/api/v1/send_login",
            method: "POST",
            json: true,   // <--Very important!!!
            body:requestData
        }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log("success="+JSON.parse(body));
//        var json_string = JSON.parse(body);
//        res.status(200).send(json_string);
     }
     else{
         console.log("error="+error);
     }
    });
});

app.post(deployPath +'/api/v1/send_location_list',function(req,res){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    //var json_data = JSON.parse(req.body);
    //console.log("bodyyy="+JSON.stringify(req.body.send_text_data.emp_id));      // your JSON

    //res.status(200);

    
    var login = req.body.send_location_list_data.emp_id;
    var company_id;
    
    var good = {data:"location_list",status:"good"};
    var bad = {data:"location_list",status:"bad"};
    
    con.query("SELECT company_id from employee where employee_id='"+login+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
           res.send(error);
       }
       else{
           if(rows.length === 0){
               res.status(200).send({data:"location_list",status:"bad1",list:rows,company_id:company_id});
           }
           else{
               company_id = rows[0].company_id;
               con.query("SELECT * from location where company_id='"+company_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query '+error);
                    res.send(error);
                }
                else{
                    if(rows.length === 0){
                        res.status(200).send({data:"location_list",status:"bad2",list:rows,company_id:company_id,query:"SELECT * from location where company_id='"+company_id+"'"});
                    }
                    else{
                        res.status(200).send({data:"location_list",status:"good",list:rows,company_id:company_id});
                    }

                }
            });
           }
           
       }
   }); 
   
  
    
    
    //res.send(req.body);    // echo the result back

//    var getdata = req.body;
//    res.status(200).send(getdata);

});

app.post(deployPath +'/api/v1/send_login',function(req,res){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    //var json_data = JSON.parse(req.body);
    //console.log("bodyyy="+JSON.stringify(req.body.send_text_data.emp_id));      // your JSON

    //res.status(200);

    
    var login = req.body.send_login_data.emp_login;
    var pass = req.body.send_login_data.emp_pass;
   
    
    var good = {data:"good"};
    var bad = {data:"bad"};
    
    con.query("SELECT * from employee where employee_email = '"+login+"' and employee_password='"+pass+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
           res.send(error);
       }
       else{
           if(rows.length === 0){
               res.status(200).send(bad);
           }
           else{
               
               con.query("UPDATE employee set employee_status = 'online' where employee_id ='"+rows[0].employee_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query '+error);
                    res.send(error);
                }
                else{
                    
                }
            });
   
               var datasend = {data:"good",employee_id:rows[0].employee_id,employee_name:rows[0].employee_name,employee_phone_no:rows[0].employee_phone_no,employee_email:rows[0].employee_email };
               res.status(200).send(datasend);
           }
           
       }
   }); 
    
    
    //res.send(req.body);    // echo the result back

//    var getdata = req.body;
//    res.status(200).send(getdata);

});

app.post(deployPath +'/api/v1/send_logout',function(req,res){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    //var json_data = JSON.parse(req.body);
    //console.log("bodyyy="+JSON.stringify(req.body.send_text_data.emp_id));      // your JSON

    //res.status(200);

    
    var login = req.body.send_logout_data.emp_id;
   
    
    var good = {data:"logout",status:"good"};
    var bad = {data:"logout",status:"bad"};
    
    con.query("UPDATE employee set employee_status = 'offline' where employee_id = '"+login+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
           res.send(error);
       }
       else{
           if(rows.length === 0){
               res.status(200).send(bad);
           }
           else{
               res.status(200).send(good);
           }
           
       }
   }); 
    
    
    //res.send(req.body);    // echo the result back

//    var getdata = req.body;
//    res.status(200).send(getdata);

});

app.get(deployPath +'/api/v1/get_text',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

        var requestData = {send_text_data:{emp_id:"1",location:"B0:B4:48:DC:BF:CC",remark:"情况 1",remark_other:"",text:"test text"}};

    request({
            url: "http://localhost:3000/api/v1/send_text",
            method: "POST",
            json: true,   // <--Very important!!!
            body:requestData
        }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        //var json_string = JSON.parse(body);
        res.status(200).send(body);
     }
     else{
         console.log("error22="+error);
     }
    });
});

app.post(deployPath +'/api/v1/send_text',function(req,res){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    //var json_data = JSON.parse(req.body);
    //console.log("bodyyy="+JSON.stringify(req.body.send_text_data.emp_id));      // your JSON
    //res.charset = 'utf-8';
    //res.contentType('text');
    //res.status(200);

    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();

    if(ddate < 10){
        ddate = "0"+ddate;
    }
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }

    if(dhour < 10){
        dhour = "0"+dhour;
    }
    if(dminutes < 10){
        dminutes = "0"+dminutes;
    }
    if(dseconds < 10){
        dseconds = "0"+dseconds;
    }
    
    var newdate;
    if(dhour < 12){
        newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    }
    else{
        newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    }
    
    var employee_id = req.body.send_text_data.emp_id;
    var doc_location = req.body.send_text_data.location;
    var doc_remark = req.body.send_text_data.remark;
    var remark_other = decodeURIComponent(req.body.send_text_data.remark_other);
    var doc_text = decodeURIComponent(req.body.send_text_data.text);
    var doc_name = employee_id + '-' + Date.now()+'-text';
    var location_code;
    var company_id;
    doc_text = doc_text.replace(/\+/g,' ');
    remark_other = remark_other.replace(/\+/g,' ');
    
    var remarks = doc_remark.split(" ");
    var new_remark;
    
   if(remarks[1] === '1'){
       new_remark = '情况 1';
   }
   else if(remarks[1] === '2'){
       new_remark = '情况 2';
   }
   else if(remarks[1] === '3'){
       new_remark = '情况 3';
   }
   else {
       new_remark = '其他';
   }
    
    
    var good = { data:"send_text",status:"good", text:doc_text};
    var bad = {data:"send_text",status:"bad" };
    var remark = {data:"send_text",status:doc_text };
    
    con.query("SELECT * FROM employee where employee_id = '"+employee_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query '+error);
                    res.send(error);
                }
                else{
                    company_id = rows[0].company_id;
                    
                    con.query("SELECT location_code from location where beacon_id like '%"+doc_location+"%' and company_id = '"+company_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                        res.send(error);
                    }
                    else{
                        
                        if(rows.length >0){
                        location_code = rows[0].location_code;
                        console.log("locationcode ="+location_code);
                        //console.log('Successful query\n');
                        //console.log(rows);
                        con.query("INSERT INTO document(document_name,document_type,doc_emp_id,document_time,document_location,document_remark,document_remark_other,document_text) values ('"+doc_name+"','笔记','"+employee_id+"','"+newdate+"','"+location_code+"','"+new_remark+"','"+remark_other+"','"+doc_text+"')",function(error,rows,fields){
                         if(!!error){
                             console.log('Error in the query '+error);
                         }
                         else{
                             //console.log('Successful query\n');
                             //console.log(rows);
                             res.status(200).send(good);
                            // res.status(200).send(remark);
                         }
                     }); 
                     
                        }
                        
                        else{
                            location_code = doc_location;
                            con.query("INSERT INTO document(document_name,document_type,doc_emp_id,document_time,document_location,document_remark,document_remark_other,document_text) values ('"+doc_name+"','笔记','"+employee_id+"','"+newdate+"','"+location_code+"','"+new_remark+"','"+remark_other+"','"+doc_text+"')",function(error,rows,fields){
                                if(!!error){
                                    console.log('Error in the query '+error);
                                }
                                else{
                                    //console.log('Successful query\n');
                                    //console.log(rows);
                                    res.status(200).send(good);
                                   // res.status(200).send(remark);
                                }
                            });
                        }
                    }
                }); 
                }
            }); 
    
    
    
    
    //res.send(req.body);    // echo the result back

//    var getdata = req.body;
//    res.status(200).send(getdata);

});

app.get(deployPath +'/api/v1/get_image',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

        var requestData = {"send_image_data":{data:"\/9j\/4AAQSkZJRgABAQAAAQABAAD\/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB\nAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH\/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEB\nAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH\/wAARCAzACZADASIA\nAhEBAxEB\/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL\/8QAtRAAAgEDAwIEAwUFBAQA\nAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3\nODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWm\np6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6\/8QAHwEA\nAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL\/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSEx\nBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElK\nU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3\nuLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6\/9oADAMBAAIRAxEAPwD+DF7t\npJpSF4dt0haM+ZJJ5bZ6+mPyPXK05FdgZAArfxMueeSP0\/mevANMdUBBQqMMEbk+YnzMOme+OnbA\n5zkl6ZfAB2Rx\/J5m77+Ce2emCeeevrxQBeEAYtnazbQ\/PHmYLdOuePyJIySQKxXgBeV+DtmH\/XL+\nMdj2PfnrjOQTVwsx8oB5vL2xwhV\/gwSPf14yc9RyDmrghjOYzGreZ5iRqufnkyw87j6H3z1I5LAH\nMyF2JJLKzYTKgxjywX9T7nv\/ABHJ4G6BMAkk52kfL68kdz9T7A981pzxBmA8pY2GNynvjfjHfuc9\n+V5Iqq9v5YPzZb+6cf6vJGe\/XHr68kjJAKR+cvuCp8oxj6t\/te5Pt9ATSxOduw\/9Mgp2kc8jkZ9u\nB9ecgku+RcFQ2Sw3Nz6t\/MYznoMck5AjXnC4X5P43HHB5xz\/APq6ZBoAmVyxKkbpF\/xbnqOPz7cg\nkVGTu+QjcvGGbPq3qff9SSOlRvu3k5PGN35yf1GcHrk8nFCDaSOnyj\/0Ij046dP1wQSARCPByx4J\n\/hz6t3J7\/wBTycc6+neX9oQqwKlv4m54Zx+Zx+ZHUtzlkptIB\/h4H\/TTLe\/+6Rn3HByadF+7+XHb\nn5sZ5b0JPofy6jJHJKHMmr\/1eVtL+emvfuyXG\/X+tfP0\/Hc908NO9yiKlx+5f9zcyMnmD7MYm\/dd\neSdvTOeF5Jya1Na0uOKKKW0guIbWZhNH5mZJH+ZoAfOx16\/6NyOvIG41wXhu8WEPH5nylYvlVfuS\nZb3P9SORnkmvQZtVia3CPcSNJbqPLj25jfBb3PkG14\/7+98ZblnLmk30tZel29dd9vS71drvJu7f\nyS+Tk+\/n\/VrvlW0kyztJNKy7lkfdt8vu\/wC5IyfJ+6T\/AN8jPct\/sjz0SH\/VzRs\/zR\/xx5kHlTcc\n8f15I5rcTV4ppH8\/5JlP7rasMhT92+OCevXHPp1Iamm9jhiLLKrSNiaRVY+b++Lf9O3+TnjrXabm\nSNDIJZgxVXh3Ksh8x5NzeT53Jx6gc\/xc9asx6ctvFKpdZHXDrmRfNSTdJ3Pv06855yCBFNqLOu64\nmVZI2A2so8yQliIO\/TKn+vPJgur2OSxOV3RxLsjaNj5hyzfvZsgn\/Svx7cng0oQ0arNN7r3dN2v5\neyvdrfS9020k7NSs\/lp18v6u1ra7Y+JxEzr5rBotzfuMeZmT\/a4gOIfxwMkgk7ltbIgkZUjjDRiM\ny8\/8tTJ\/ywhPf36eoFcrHf8A7sOCsJZQhjWIjZy+YuAfY8njpk4JFx9aQBlYbdixfJCvl7PILe\/Q\n9ieevJOaHCHs7aW7aK2stVrp1fnrp8QWVmun\/Bev4f8AB0d9J7SM3MEcrxs22TbJHn5I8sJoufc5\nznPrkkVLHGLMm3tTukaSLlc\/OZi45hJ\/fZxwbnOD0zkk8w18C7vAW27g6uuPkwzfupuf58jJ5JIp\nE1Nod8kUnzNNFwrc+WN\/nHr\/ALvuMHOCeWM27gzx3IneTpiOQmPzN\/Le5\/ccD\/j2\/vAEnaaklaBI\nzIu24jMlt5m1jHJOZS3Hkk\/8u2c856HkkE1zN7qgnYODHHMzYaSOTG2MFv3UMO7p+fUAgEDNeO9D\nKWYRrIv7hZlU7\/vP5PU+oX8MepyAdk8JiaJ\/Oj3LGB5LDzBDy482b5j9fs+T3HXcay5bhFiR0Zd0\nM0jiNgfMSSVmF5LjPbr+JBz1OKt8zb5N\/mMkYSTEnln96W87zucg9CenoSTtNV7i+EiDHyx7vlk8\nr\/lplv3XXtheOvJHBBNZ8tT\/AJ+\/+SR\/zJtL+b\/yVf5lW9nQ+bJ5WxlYbSqn5+W64PqMgHPfkYOc\nm6uZmQKzI3lL8u7PyRkn6+nHfOeoHNjzHd0Dnd+8Hlr\/AMsjy2D+HJz0wR1qrO+3z0Ij3H+Jl3\/x\nOPU9c5PTHHJzWhRSdQMsB8oCAf7fLdMnr8vA9O5yKlsnaMybdoQKGcMOoBOPcYyc89+poMYABEg3\nH5AmB8nLZ7nrnv069TmoThSQE6D+Invux3\/LqeOpxXM4rlcVJtO1nZ7JuyeurtZ383okteWdOEr6\nvXqtG9Xve6eijZ2vvrZa95pmqyyKsM8mUjx80YBjMeWHYDHbGeevJwDXVw7Zid8nlorD5mQySeXl\ns8Zznge\/3uCBz5ZZ3AwM7UVeHVSeBlgOCec9fbA4yCa7PRtSWEEL88AIwW\/efvMv09OcdzjIOcMw\nHiYmg4OU0tG9v+3pK\/le90tbpt3Ssj9g4RzhOlKjiktVZ6JPVy0tdXbtrH+Xl1bdn19lcLYs0sfz\npIkmwMxfozd\/1646jJAyKMVwks7SMY1VuSEMWOr\/AN4Z6nj0yB0waznJl5zujZD8vB24LZ4JPtn2\nA5IPNyzEEQkCorD9zt5939D\/AJBA5wc+ROmlzX3aVukWk5LW70lZtLfonJXuffU8znLmpqVqGq6v\nmtfo+vwrytpK1rbOoxrLagZWR4\/kiZc5eMM3PTM3BH5jBwMtgSqTEqOwMgUYdBwUy+O4yehPTqow\ncZOubsMZ4m3EqRj5T8vJ\/wBrnqffp1BYVDJbCVIpBiRiu9mXJi8vcQepP48n064xzUm6L5ZXsndP\nrfW6tqlFpXau1dp6tnRLE86bg9rX721Se7et9U0+l3dXOaa1\/dK6kGMuPMIU\/K+TiPk55AbqepyO\ncg+u\/DLUJbW4SRHZpUWS3iDniK3MbiaPBPce+Mse7E15oysRMsSsqqw3qF7ZkGOR2459xyTyei8I\nXX2XUP3jhUdlZlDfuzgyfvRCOv8ACTnnBHPGTGYxeJwGIpt3atK32rNz0b1s2t2nt7qWs5HDf96\/\nZ6XtHytzSWvl7t0ls77OyfvHic+dZzxWxYQalGLmQLiOSSQRMP8AXz5\/5YboO\/OOvWvjPxNpt1Z3\nswlVSiSSeS44kMYZh++GD53QkHPryQefrS8na4hEkBbJjGI8fuxGCwPfn9xjA9S3U8nwT4j2TSed\ndhoyI5wsqqMcylsDk4E2M\/hjJ+"}};

    request({
            url: "http://localhost:3000/api/v1/send_image",
            method: "POST",
            json: true,   // <--Very important!!!
            body:requestData
        }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        //var json_string = JSON.parse(body);
        res.status(200).send(body);
     }
     else{
         console.log("error23="+error);
     }
    });
});

app.post(deployPath +'/api/v1/send_image', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    var b64string= req.body.send_image_data.data;
    var buf = Buffer.from(b64string, 'base64'); // Ta-da
    var company_id;
    //

    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();

    if(ddate < 10){
        ddate = "0"+ddate;
    }
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }

    if(dhour < 10){
        dhour = "0"+dhour;
    }
    if(dminutes < 10){
        dminutes = "0"+dminutes;
    }
    if(dseconds < 10){
        dseconds = "0"+dseconds;
    }
    
    var newdate;
    if(dhour < 12){
        newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    }
    else{
        newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    }
    
    var employee_id = req.body.send_image_data.emp_id;
    var doc_location = req.body.send_image_data.location;
    var doc_remark = req.body.send_image_data.remark;
    var remark_other = decodeURIComponent(req.body.send_image_data.remark_other);
    var doc_name = employee_id + '_' + Date.now()+'.jpg';
    var location_code;
    remark_other = remark_other.replace(/\+/g,' ');
    
    var remarks = doc_remark.split(" ");
    var new_remark;
    
   if(remarks[1] === '1'){
       new_remark = '情况 1';
   }
   else if(remarks[1] === '2'){
       new_remark = '情况 2';
   }
   else if(remarks[1] === '3'){
       new_remark = '情况 3';
   }
   else {
       new_remark = '其他';
   }
    
    fs.writeFile("uploads/"+doc_name, new Buffer(b64string, "base64"), function(err) {console.log("fs error=="+err);});
    
    var filepath = "uploads/"+doc_name;
    
    var good = { data:"send_image",status:"good" };
    var bad =  { data:"send_image",status:"bad" };
    
    con.query("SELECT * FROM employee where employee_id = '"+employee_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query '+error);
                    res.send(error);
                }
                else{
                    company_id = rows[0].company_id;
                    
                    con.query("SELECT location_code from location where beacon_id like '%"+doc_location+"%' and company_id = '"+company_id+"'",function(error,rows,fields){
                        if(!!error){
                            console.log('Error in the query '+error);
                            res.send(error);
                        }
                        else{
                             if(rows.length >0){
                            location_code = rows[0].location_code;
                            console.log("locationcode ="+location_code);
                            //console.log('Successful query\n');
                            //console.log(rows);
                            con.query("INSERT INTO document(document_name,document_type,doc_emp_id,document_time,document_location,document_remark,document_remark_other,document_image) values ('"+doc_name+"','照片','"+employee_id+"','"+newdate+"','"+location_code+"','"+new_remark+"','"+remark_other+"','"+filepath+"')",function(error,rows,fields){
                             if(!!error){
                                 console.log('Error in the query '+error);
                                 res.send(error);
                             }
                             else{
                                 //console.log('Successful query\n');
                                 //console.log(rows);
                                 res.status(200).send(good);
                             }
                         }); 
                     }
                     
                     else{
                         location_code = doc_location;
                            console.log("locationcode ="+location_code);
                            //console.log('Successful query\n');
                            //console.log(rows);
                            con.query("INSERT INTO document(document_name,document_type,doc_emp_id,document_time,document_location,document_remark,document_remark_other,document_image) values ('"+doc_name+"','照片','"+employee_id+"','"+newdate+"','"+location_code+"','"+new_remark+"','"+remark_other+"','"+filepath+"')",function(error,rows,fields){
                             if(!!error){
                                 console.log('Error in the query '+error);
                                 res.send(error);
                             }
                             else{
                                 //console.log('Successful query\n');
                                 //console.log(rows);
                                 res.status(200).send(good);
                             }
                         }); 
                     }
                        }
                    });
                }
            });
    
     
    
    

 //res.send(req.body.send_image_data.data); 
});

app.get(deployPath +'/api/v1/get_audio',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

        var requestData = {"send_audio_data":{data:"AAAAGGZ0eXAzZ3A0AAAAAGlzb20zZ3A0AAAMAGZyZWUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"}};

    request({
            url: "http://localhost:3000/api/v1/send_audio",
            method: "POST",
            json: true,   // <--Very important!!!
            body:requestData
        }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        //var json_string = JSON.parse(body);
        res.status(200).send(body);
     }
     else{
         console.log("error23="+error);
     }
    });
});

app.post(deployPath +'/api/v1/send_audio', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    var b64string= req.body.send_audio_data.data;
    var buf = Buffer.from(b64string, 'base64'); // Ta-da
    var company_id;

    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();

    if(ddate < 10){
        ddate = "0"+ddate;
    }
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }

    if(dhour < 10){
        dhour = "0"+dhour;
    }
    if(dminutes < 10){
        dminutes = "0"+dminutes;
    }
    if(dseconds < 10){
        dseconds = "0"+dseconds;
    }
    
    var newdate;
    if(dhour < 12){
        newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    }
    else{
        newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    }
    
    var employee_id = req.body.send_audio_data.emp_id;
    var doc_location = req.body.send_audio_data.location;
    var doc_remark = req.body.send_audio_data.remark;
    var remark_other = decodeURIComponent(req.body.send_audio_data.remark_other);
    var doc_name = employee_id + '_' + Date.now()+'.mp3';
    var location_code;
    remark_other = remark_other.replace(/\+/g,' ');
    
    var remarks = doc_remark.split(" ");
    var new_remark;
    
   if(remarks[1] === '1'){
       new_remark = '情况 1';
   }
   else if(remarks[1] === '2'){
       new_remark = '情况 2';
   }
   else if(remarks[1] === '3'){
       new_remark = '情况 3';
   }
   else {
       new_remark = '其他';
   }
    
    fs.writeFile("uploads/"+doc_name, new Buffer(b64string, "base64"), function(err) {console.log("fs error=="+err);});
    
    var filepath = "uploads/"+doc_name;
    
    var good = { data:"send_audio",status:"good" };
    var bad =  { data:"send_audio",status:"bad" };
    
    con.query("SELECT * FROM employee where employee_id = '"+employee_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query '+error);
                    res.send(error);
                }
                else{
                    company_id = rows[0].company_id;
                    
                    con.query("SELECT location_code from location where beacon_id like '%"+doc_location+"%' and company_id='"+company_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                        res.send(error);
                    }
                    else{
                        
                        if(rows.length >0){
                        location_code = rows[0].location_code;
                        console.log("locationcode ="+location_code);
                        //console.log('Successful query\n');
                        //console.log(rows);
                        con.query("INSERT INTO document(document_name,document_type,doc_emp_id,document_time,document_location,document_remark,document_remark_other,document_audio) values ('"+doc_name+"','音响','"+employee_id+"','"+newdate+"','"+location_code+"','"+new_remark+"','"+remark_other+"','"+filepath+"')",function(error,rows,fields){
                         if(!!error){
                             console.log('Error in the query '+error);
                             res.send(error);
                         }
                         else{
                             //console.log('Successful query\n');
                             //console.log(rows);
                             res.status(200).send(good);
                         }
                     }); 
                     
                        }
                        else{
                            location_code = doc_location;
                            con.query("INSERT INTO document(document_name,document_type,doc_emp_id,document_time,document_location,document_remark,document_remark_other,document_audio) values ('"+doc_name+"','音响','"+employee_id+"','"+newdate+"','"+location_code+"','"+new_remark+"','"+remark_other+"','"+filepath+"')",function(error,rows,fields){
                                    if(!!error){
                                        console.log('Error in the query '+error);
                                        res.send(error);
                                    }
                                    else{
                                        //console.log('Successful query\n');
                                        //console.log(rows);
                                        res.status(200).send(good);
                                    }
                                }); 
                        }
                    }
                });
                }
            });
    
     
    
    

});

app.get(deployPath +'/api/v1/get_location',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

        var requestData = {send_location_data:{emp_id:"99",location:"B0:B4:48:DC:BA:F9"}};

    request({
            url: "http://localhost:3000/api/v1/send_location",
            method: "POST",
            json: true,   // <--Very important!!!
            body:requestData
        }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        //var json_string = JSON.parse(body);
        res.status(200).send(body);
     }
     else{
         console.log("error22="+error);
     }
    });
});

app.get(deployPath +'/api/v1/get_route',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

        var requestData = {send_route_data:{emp_id:"1"}};

    request({
            url: "http://localhost:3000/api/v1/send_route",
            method: "POST",
            json: true,   // <--Very important!!!
            body:requestData
        }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        //var json_string = JSON.parse(body);
        res.status(200).send(body);
     }
     else{
         console.log("error22="+error);
     }
    });
});

app.post(deployPath +'/api/v1/send_route', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();
    var d_date = d.getDate();
    var d_month = d.getMonth()+1;;

    if(ddate < 10){
        ddate = "0"+ddate;
    }
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }

    if(dhour < 10){
        dhour = "0"+dhour;
    }
    if(dminutes < 10){
        dminutes = "0"+dminutes;
    }
    if(dseconds < 10){
        dseconds = "0"+dseconds;
    }
    
    var newdate;
    newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    
    console.log("newwww--"+newdate);
    
    var employee_id = req.body.send_route_data.emp_id;
   
    con.query("SELECT * from route left join location on route.route_name = location.location_code where employee_id='"+employee_id+"' and day(route_datetime) ='"+d_date+"' and month(route_datetime) ='"+d_month+"' and year(route_datetime)='"+dyear+"' and route_attendance = '0' limit 1",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
                res.send(error);
            }
            else{
                console.log("in hre6");
                //console.log('Successful query\n');
                //console.log(rows);
                if(rows.length !== 0){
                var send_loc = {data:"route",route_name : rows[0].route_name,beacon_id : rows[0].beacon_id};
                res.status(200).send(send_loc);
            }
            else{
                var send_loc = {data:"route",route_name : "0",beacon_id : "0"};
                res.status(200).send(send_loc);
            }
            }
        }); 
    
    

});

app.post(deployPath +'/api/v1/send_location', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();
    var d_date = d.getDate();
    var d_month = d.getMonth()+1;;

    if(ddate < 10){
        ddate = "0"+ddate;
    }
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }

    if(dhour < 10){
        dhour = "0"+dhour;
    }
    if(dminutes < 10){
        dminutes = "0"+dminutes;
    }
    if(dseconds < 10){
        dseconds = "0"+dseconds;
    }
    
    var newdate;
    newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    //console.log("neweedatee = "+newdate);
   
    
    var employee_id = req.body.send_location_data.emp_id;
    var location = req.body.send_location_data.location;
    var location_code = '';
    var company_id = '';
    
    var good = {send_audio_data: { data:"good" }};
    var bad = {send_audio_data: { data:"bad" }};
    
    con.query("SELECT * FROM employee where employee_id = '"+employee_id+"'",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query '+error);
                    res.send(error);
                }
                else{
                    company_id = rows[0].company_id;
                    //console.log("company_id=="+company_id);
                    con.query("SELECT * from location where beacon_id like '%"+location+"%' and company_id = '"+company_id+"'",function(error,rows,fields){
                            if(!!error){
                                console.log('Error in the query '+error);
                                res.send(error);
                            }
                            else{
                                console.log(rows);
                                location_code = rows[0].location_code;
                                console.log("locationcode ="+location_code);
                                //console.log('Successful query\n');
                                //console.log(rows);

                                 con.query("UPDATE employee set employee_location='"+location_code+"', employee_time='"+newdate+"' where employee_id='"+employee_id+"'",function(error,rows,fields){
                                     if(!!error){
                                         console.log('Error in the query '+error);
                                         res.send(error);
                                     }
                                     else{

                                     }
                                 }); 

                                 con.query("SELECT * from history where employee_id = '"+employee_id+"' order by path_datetime desc limit 1",function(error,rows,fields){
                                     if(!!error){
                                         console.log('Error in the query '+error);
                                         res.send(error);
                                     }
                                     else{
                                         if(rows.length === 0){
                                             con.query("INSERT INTO history(location_id,employee_id,path_datetime) values ('"+location_code+"','"+employee_id+"','"+newdate+"')",function(error,rows,fields){
                                                 if(!!error){
                                                     console.log('Error in the query '+error);
                                                     res.send(error);
                                                 }
                                                 else{

                                                 }
                                             }); 
                                         }
                                         else{
                                             if(rows[0].location_id !== location_code){
                                                 con.query("INSERT INTO history(location_id,employee_id,path_datetime) values ('"+location_code+"','"+employee_id+"','"+newdate+"')",function(error,rows,fields){
                                                     if(!!error){
                                                         console.log('Error in the query '+error);
                                                         res.send(error);
                                                     }
                                                     else{

                                                     }
                                                 }); 
                                             }
                                         }

                                     }
                                 }); 



                                con.query("SELECT * from path where employee_id='"+employee_id+"' order by path_datetime desc limit 1",function(error,rows,fields){
                                     if(!!error){
                                         console.log('Error in the query '+error);
                                         res.send(error);
                                     }
                                     else{
                                         //console.log("rows.length11--"+rows.length);
                                         if(rows.length !== 0){
                                             //console.log("rows.location_id11--"+rows[0].location_id+" locatoon code=="+location_code);
                                         if(rows[0].location_id !== location_code){

                                                 con.query("INSERT INTO path(location_id,employee_id,path_datetime) values ('"+location_code+"','"+employee_id+"','"+newdate+"')",function(error,rows,fields){
                                                 if(!!error){
                                                     console.log('Error in the query '+error);
                                                     res.send(error);
                                                 }
                                                 else{

                                                         con.query("UPDATE route set route_attendance='1' where route_name='"+location_code+"' and employee_id='"+employee_id+"' and day(route_datetime) ='"+d_date+"' and month(route_datetime) ='"+d_month+"' and year(route_datetime)='"+dyear+"'",function(error,rows,fields){
                                                         if(!!error){
                                                             console.log('Error in the query '+error);
                                                             res.send(error);
                                                         }
                                                         else{
                                                             //console.log('Successful query\n');
                                                             //console.log(rows);
                                                             //res.status(200).send(good);
                                                         }
                                                     }); 
                                                 }
                                             }); 
                                         }
                                       }
                                       else{

                                           con.query("INSERT INTO path(location_id,employee_id,path_datetime) values ('"+location_code+"','"+employee_id+"','"+newdate+"')",function(error,rows,fields){
                                                 if(!!error){
                                                     console.log('Error in the query '+error);
                                                     res.send(error);
                                                 }
                                                 else{

                                                         con.query("UPDATE route set route_attendance='1' where route_name='"+location_code+"' and employee_id='"+employee_id+"' and day(route_datetime) ='"+d_date+"' and month(route_datetime) ='"+d_month+"' and year(route_datetime)='"+dyear+"'",function(error,rows,fields){
                                                         if(!!error){
                                                             console.log('Error in the query '+error);
                                                             res.send(error);
                                                         }
                                                         else{
                                                             //console.log('Successful query\n');
                                                             //console.log(rows);
                                                             //res.status(200).send(good);
                                                         }
                                                     }); 
                                                 }
                                             }); 

                                       }
                                     }
                                 });


                                 con.query("UPDATE employee set employee_location='"+location_code+"', employee_time='"+newdate+"' where employee_id='"+employee_id+"'",function(error,rows,fields){
                                     if(!!error){
                                         console.log('Error in the query '+error);
                                         res.send(error);
                                     }
                                     else{

                                         con.query("SELECT * from route left join location on route.route_name = location.location_code where employee_id='"+employee_id+"' and day(route_datetime) ='"+d_date+"' and month(route_datetime) ='"+d_month+"' and year(route_datetime)='"+dyear+"' and route_attendance = '0' limit 1",function(error,rows,fields){
                                             if(!!error){
                                                 console.log('Error in the query '+error);
                                                 res.send(error);
                                             }
                                             else{

                                                 //console.log('Successful query\n');
                                                 console.log(rows);
                                                if(rows.length !== 0){
                                                     var send_loc = {data:"route",route_name : rows[0].route_name,beacon_id : rows[0].beacon_id};
                                                     res.status(200).send(send_loc);
                                                 }
                                                 else{
                                                     var send_loc = {data:"route",route_name : "0",beacon_id : "0"};
                                                     res.status(200).send(send_loc);
                                                 }
                                             }
                                         }); 

                                     }
                                 }); 

                            }

                        });
                }
            }); 
    
    
     
    
    

});

app.post(deployPath +'/api/v1/send_gps_loc', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var d = createDateAsUTC(new Date());
//    d.setMinutes(d.getMinutes()+480);
    d.setMinutes(d.getMinutes()-480);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();
    var d_date = d.getDate();
    var d_month = d.getMonth()+1;;

    if(ddate < 10){
        ddate = "0"+ddate;
    }
    if(dmonth < 10){
        dmonth = "0"+dmonth;
    }

    if(dhour < 10){
        dhour = "0"+dhour;
    }
    if(dminutes < 10){
        dminutes = "0"+dminutes;
    }
    if(dseconds < 10){
        dseconds = "0"+dseconds;
    }
    
    var newdate;
    newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    //console.log("neweedatee = "+newdate);
   
    
    var employee_id = req.body.send_gps_loc_data.emp_id;
    var location = req.body.send_gps_loc_data.gps_loc;
    
    var good = {send_gps_loc_data: { data:"good" }};
    var bad = {send_gps_loc_data: { data:"bad" }};
    
    
     con.query("SELECT * from history_gps where employee_id='"+employee_id+"' order by path_datetime desc limit 1",function(error,rows,fields){
                if(!!error){
                    console.log('Error in the query '+error);
                    res.send(error);
                }
                else{
                    //console.log("rows.length11--"+rows.length);
                    if(rows.length !== 0){
                        //console.log("rows.location_id11--"+rows[0].location_id+" locatoon code=="+location_code);
                    if(rows[0].gps_loc !== location){
                        
                            con.query("INSERT INTO history_gps(employee_id,path_datetime,gps_loc) values ('"+employee_id+"','"+newdate+"','"+location+"')",function(error,rows,fields){
                            if(!!error){
                                console.log('Error in the query '+error);
                                res.send(error);
                            }
                            else{
                                    
                                    con.query("UPDATE employee set employee_gps='"+location+"',employee_time='"+newdate+"' where employee_id='"+employee_id+"'",function(error,rows,fields){
                                    if(!!error){
                                        console.log('Error in the query '+error);
                                        res.send(error);
                                    }
                                    else{
                                        //console.log('Successful query\n');
                                        //console.log(rows);
                                        res.status(200).send(good);
                                    }
                                }); 
                            }
                        }); 
                    }
                  }
                  else{
                      
                      con.query("INSERT INTO history_gps(employee_id,path_datetime,gps_loc) values ('"+employee_id+"','"+newdate+"','"+location+"')",function(error,rows,fields){
                            if(!!error){
                                console.log('Error in the query '+error);
                                res.send(error);
                            }
                            else{
                                
                                    con.query("UPDATE employee set employee_gps='"+location+"',employee_time='"+newdate+"' where employee_id='"+employee_id+"'",function(error,rows,fields){
                                    if(!!error){
                                        console.log('Error in the query '+error);
                                        res.send(error);
                                    }
                                    else{
                                        //console.log('Successful query\n');
                                        //console.log(rows);
                                        res.status(200).send(good);
                                    }
                                }); 
                            }
                        }); 
                      
                  }
                }
            });
                       
    
//    con.query("INSERT INTO path(employee_id,path_datetime,gps_loc) values ('"+employee_id+"','"+newdate+"','"+location+"')",function(error,rows,fields){
//       if(!!error){
//           console.log('Error in the query '+error);
//           res.send(error);
//       }
//       else{
//            
//            res.status(200).send(good);
//            
//           
//       }
//   }); 

});

app.post(deployPath +'/api/v1/save_map/:map_string', function(req, res) {
    
     var map_string = req.params.map_string;
     var company_id = req.session.passport.user.company_id;
     
    con.query("INSERT INTO map(map_string,company_id) values ('"+map_string+"','"+company_id+"')",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
           res.send(error);
       }
       else{
          res.send('good');
       }
   }); 
});

app.post(deployPath +'/api/v1/save_map', function(req, res,next) {
    
     //var map_string = req.params.map_string;
     map_string = req.sanitize( 'map_string' );
     //console.log("map_string== "+map_string);
     var company_id = req.session.passport.user.company_id;
     
//     con.query("TRUNCATE map",function(error,rows,fields){
//         if(!!error){
//           console.log('Error in the query '+error);
//           //res.send(error);
//       }
//       else{
           con.query("UPDATE map set map_string='"+map_string+"' where company_id='"+company_id+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
                //res.send(error);
            }
            else{
                res.status(204).send();
               //res.send('good');
            }
        });
       //}
       
   //}); 
     
     
});

app.post(deployPath +'/api/v1/clean_map/', function(req, res) {
    con.query("TRUNCATE map",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
           res.send(error);
       }
       else{
          res.send('good');
       }
   }); 
});

app.post(deployPath +'/api/v1/save_markers', function(req, res,next) {
    
     //var map_string = req.params.map_string;
     markers = req.sanitize( 'markers' );
     floorplan_id = req.sanitize( 'floorplan_id' );
     //console.log("map_string== "+map_string);
    
    con.query("UPDATE floor_plan set markers='"+markers+"' where floorplan_id='"+floorplan_id+"'",function(error,rows,fields){
     if(!!error){
         console.log('Error in the query '+error);
         //res.send(error);
     }
     else{
         res.status(204).send();
        //res.send('good');
     }
    });
  
});

app.get(deployPath +'/api/v1/save_remarks', function(req, res,next) {
    
     //var map_string = req.params.map_string;
     markers = req.sanitize( 'markers' );
     floorplan_id = req.sanitize( 'floorplan_id' );
     //console.log("map_string== "+map_string);
    
    con.query("INSERT INTO remark(remark_id,remarks) values ('1','情况1')",function(error,rows,fields){
     if(!!error){
         console.log('Error in the query '+error);
         //res.send(error);
     }
     else{
         //res.status(204).send();
        res.send('good');
     }
    });
  
});
 //----------------------------REST API-------------------------------------
 
app.get('/logout', function (req, res){
  req.session.destroy(function (err) {
    res.redirect('/'); 
  });
});


//setInterval(function(){ 
//       con.query('SELECT * FROM company',function(err,rows){
//         if(err) throw err;
////         console.log('Data received from Db:\n');
////         console.log("data from db="+JSON.stringify(rows));
//         
//       });
//}, 10000);
io.use(sharedsession(session, {
    autoSave:true
}));

io.on('connection', function (socket) {
    //console.log("goobal use id --"+global_user_id);
    //console.log("goobal comp id --"+global_company_id);
    //console.log('connnenenne1----');
    setInterval(function(){ 
       // console.log('connnenenne----');
        //console.log(socket.handshake.session.passport.user);
        //var company_id = '1';
    if(global_user_id !== null || global_user_id !== undefined){
        //console.log(socket.handshake.session.passport.user);
        var company_id = global_company_id;
        var language = socket.handshake.session.language;
        //console.log("language---"+language);
        var d = createDateAsUTC(new Date());
    //    d.setMinutes(d.getMinutes()+480);
        d.setMinutes(d.getMinutes()-480);
        var ddate = d.getDate();
        var dmonth = d.getMonth()+1;
        var dyear = d.getFullYear();
        var dhour = d.getHours();
        var dminutes = d.getMinutes();
        var dseconds = d.getSeconds();
        

        if(ddate < 10){
            ddate = "0"+ddate;
        }
        if(dmonth < 10){
            dmonth = "0"+dmonth;
        }

        if(dhour < 10){
            dhour = "0"+dhour;
        }
        if(dminutes < 10){
            dminutes = "0"+dminutes;
        }
        if(dseconds < 10){
            dseconds = "0"+dseconds;
        }

        var newdate;
        newdate = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;

        var employee="",floor_plan="",company="";
        var floors_id = [];
        var floors = "";

        con.query("SELECT employee_id,employee_name,employee_image, employee_phone_no, employee_location, employee_time,employee_gps from employee left join company on employee.company_id = company.company_id where employee_level = '2' and company.company_id = '"+company_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query '+error);
           }
           else{
    //           console.log('Successful query\n');
               //console.log(rows);
               employee = rows;
           }
       });
       
       con.query("SELECT * from company where company_id = '"+company_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query '+error);
           }
           else{
    //           console.log('Successful query\n');
    //           console.log(rows);
               company = rows;
           }
       });

       //"SELECT * from path where day(path_datetime) = '"+ddate+"' and month(path_datetime) = '"+dmonth+"' and year(path_datetime)='"+dyear+"'"

       con.query("SELECT * FROM floor_plan where company_id='"+company_id+"'",function(error,rows,fields){
           if(!!error){
               console.log('Error in the query'+error);
           }
           else{
               floor_plan = rows;
               for(var i=0;i<rows.length;i++){
                   floors_id.push({floor_id:rows[i].floorplan_id});
               }
               floors = {floor:floors_id};
               //console.log("flooorree--"+floors);
    //           res.render('employee_management',{title:"Employee Management",data:rows});
                //console.log(employee);
                socket.emit('tracking',{title:"Tracking",data:JSON.stringify(employee),company:JSON.stringify(company),employee:employee,floor_plan:floor_plan,floors:JSON.stringify(floors),language:language});
                //socket.emit('tracking',employee);
   
           }
       });
   }
       }, 30000);


 });
 

function createDateAsUTC(date) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
}


passport.use('local_qchat', new LocalStrategy({

  usernameField: 'username',

  passwordField: 'password',

  passReqToCallback: true //passback entire req to call back
} , function (req, username, password, done){

      
      if(!username || !password ) { return done(null, false, req.flash('message','All fields are required.')); }

      var salt = '7fa73b47df808d36c5fe328546ddef8b9011b2c6';

      con.query("select * from employee where employee_email = '"+username+"'", function(err, rows){

          //console.log("err=="+err); 
          //console.log("rroows=="+JSON.stringify(rows));

        if (err) return done(req.flash('message',err));

        if(!rows.length){ return done(null, false, req.flash('message','Invalid username or password.')); }
        
//        salt = salt+''+password;
//
//        var encPassword = crypto.createHash('sha1').update(salt).digest('hex');
        
        var encPassword = password;
        var dbPassword  = rows[0].employee_password;
        
        if(!(dbPassword === encPassword)){
            
            return done(null, false, req.flash('message','Invalid username or password.'));

         }
        // console.log("rowwww = "+JSON.stringify(rows[0]));
        req.session.language = "cn";
        //global_language = 'cn';
        global_user_id = rows[0].employee_id;
        global_company_id = rows[0].company_id;
        return done(null, rows[0]);

      });

    }

));

passport.serializeUser(function(user, done){
        
//    console.log("rowwwwss = "+JSON.stringify(user));
    done(null, user);

});

passport.deserializeUser(function(user, done){
    
    done(null, user);
    
});



function isAuthenticated(req, res, next) {
   
  if (req.isAuthenticated())

    return next();

  res.redirect('/login');

}
 
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


//http.listen(3000, function(){
//  console.log('listening on *:3000');
//});
//app.listen(1337);

//module.exports = app;
module.exports = {app: app, server: http};
