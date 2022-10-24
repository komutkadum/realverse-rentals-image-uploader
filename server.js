// Requiring module
const express = require("express");
const multer = require("multer");
const app = express();
const cloudinary = require("cloudinary").v2;
const bodyParser = require("body-parser");
const fs = require("fs");

// Creating uploads folder if not already present
// In "uploads" folder we will temporarily upload
// image before uploading to cloudinary
if (!fs.existsSync("./my-uploads")) {
    fs.mkdirSync("./my-uploads");
}

// use as middle ware
app.use(function (req, res, next) {
    let allowedDomains = ['http://localhost:3000','https://realverse-rentals.vercel.app' ];
    let origin = req.headers.origin;
    if(allowedDomains.indexOf(origin) > -1){
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
})
  
// Multer setup
const upload = multer({ 
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "./my-uploads");
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        },
    }),
    fileFilter:(req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
          cb(null, true);
        } else {
          // reject file
          cb({ message: 'unsupported file format' }, false);
        }
      },
    // limits: { fileSize: 1024 * 1024 },
});

async function uploadToCloudinary(locaFilePath) {
    // locaFilePath: path of image which was just
    // uploaded to "uploads" folder
    let mainFolderName = "my-uploads";
    return cloudinary.uploader
        .upload(locaFilePath, { upload_preset: mainFolderName })
        .then((result) => {
            // Image has been successfully uploaded on
            // cloudinary So we dont need local image 
            // file anymore
            // Remove file from local uploads folder
            fs.unlinkSync(locaFilePath);
  
            return {
                message: "Success",
                url: result.url,
            };
        })
        .catch((error) => {
            // Remove file from local uploads folder
            fs.unlinkSync(locaFilePath);
            return { message: "Fail" };
        });
}
  
// Body parser configuration
app.use(bodyParser.json({limit:'200mb'}));
app.use(bodyParser.urlencoded({ limit:'200mb',extended: true }));
  
app.use("/my-uploads", express.static("my-uploads"));
  
// Cloudinary configuration
cloudinary.config({ 
    cloud_name: 'dkyst8emo', 
    api_key: '395217478781671', 
    api_secret: 'nx10zDPr-HDi1n5_muZlHZD2JWg' 
});
  
app.post("/profile-upload-multiple",upload.array("theFiles", 20),async(req, res) => {
    try{
        if(!req.files){
            throw new Error("image not present");
        }
        // if there were any
        let imageUrlList = [];
        for (let i = 0; i < req.files.length; i++) {
            let locaFilePath = req.files[i].path;
            // Upload the local image to Cloudinary
            // and get image url as response
            let result = await uploadToCloudinary(locaFilePath);
            imageUrlList.push(result.url);
        }
        return res.json(imageUrlList);
    }catch(err){
        res.status(422).json({message:err.message})
    }

});
  
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});