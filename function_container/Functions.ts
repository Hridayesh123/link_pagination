import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import DbClient from "../config/db_config";
import {
  User_model,
  Subject_model,
  Students_model,
  StudentSubject_model,
  Student_Model
} from "../models/models";
import { seq } from "../models/models";

var key = "";

function login(req: Request, res: Response): void {
  var user = {
    firstname: req.body.firstname,
    password: req.body.password,
    key: req.body.key,
  };

  const sql =
    "SELECT * FROM users WHERE firstname = $1 AND password = $2 AND secret_key =$3";

  const values = [user.firstname, user.password, user.key];

  DbClient.query(sql, values, (err, result) => {
    console.log("query result:", result);
    console.log("query error:", err);

    if (!err && result.rows.length !== 0) {
      const db_user = result.rows[0];

      key = result.rows[0].secret_key;

      try {
        jwt.sign({ user }, key, (err, token) => {
          if (err) {
            console.log(err.message);
          } else {
            console.log("DBUSER#####################: ", db_user);

            res.json({
              token,
            });
          }
        });
      } catch (err) {
        console.log(err.message);
      }
    } else {
      res.send("user not validated");
      console.log(err.message);
      console.log(err);
    }
  });
}

interface AuthenticatedRequest extends Request {
  token?: string;
}
function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const bearerHeader = req.headers["authorization"];
  console.log(bearerHeader);
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];

    jwt.verify(token, key, (err, authData: any) => {
      if (err) {
        console.log(err);
        return res.status(401).json({ message: "Unauthorized" });
      } else {
        console.log(authData.user.firstname);
        const sqll = `SELECT * FROM users where firstname=$1`;
        const values = [authData.user.firstname];
        DbClient.query(sqll, values, (err, result) => {
          if (err) {
            res.status(401).json({ message: "not verified", error: err });
          } else {
            next();
          }
        });
      }
    });
  } else {
    res.send({
      result: "invalid token",
    });
  }
}

async function getStudentsById(req: Request, res: Response): Promise<void> {
  try {
    const id_holder = parseInt(req.params.id);

    const student: any = await Students_model.findOne({
      where: { id: id_holder },
      include: [{ model: Subject_model, through: { attributes: ['marks'] } }]
      // include: [{ model: Subject_model, through: StudentSubject_model }]
      // include: Subject_model,
    });

   

      const name = student.firstname + (student.middlename ? ` ${student.middlename}` : '') + ` ${student.lastname}`;

      const studentSubjects = student.subjects;
    // console.log(studentSubjects)
      const subjects = [];

      studentSubjects.forEach((subject) => {
        const obj = {
        id: subject.id,
        code: subject.code,
        marks: subject.student_subjects.marks,
      }

      subjects.push(obj);
    });


      const responseBody = {
        id: student.id,
        name,
        address: student.address,
        subjects,
      };

      res.status(200).json(responseBody);
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: "Student not found." });
  }
}

async function getSubject(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 5;
    const searchParam = req.query.code as string || "";
    const offset = (page - 1) * pageSize;

    // const subjects = await Subject_model.findAll({
    //   limit: pageSize,
    //   offset,
    //   order: [["id", "ASC"]],
    // });

    // res.send(subjects);
    const allSubjects = await seq.query('SELECT * FROM getALLSubjects(:searchParam, :page, :pageSize);',{
      replacements: {searchParam: searchParam, page: page, pageSize: pageSize }
    })
    res.send(allSubjects)
  } catch (err) {
    console.log(err.message);
    res.send({ error: err });
  }
}

function getSubjectsById(req: Request, res: Response): void {
  const id = parseInt(req.params.id);
  DbClient.query(`SELECT * FROM subjects WHERE id=${id}`, (err, result) => {
    if (err) {
      console.log(err.message);
    } else {
      res.send(result.rows);
    }
  });
}

function createSubject(req: Request, res: Response): void {
  const name = req.body.name;
  const code = req.body.code;
  DbClient.query(
    `INSERT INTO subjects(name, code) VALUES($1, $2)`,
    [name, code],
    (err, result) => {
      if (err) {
        console.log(err.message);
      } else {
        res.send("successfully inserted");
      }
    }
  );
}

function updateSubject(req: Request, res: Response): void {
  const id = parseInt(req.params.id);
  const name = req.body.name;
  const code = req.body.code;
  DbClient.query(
    `UPDATE subjects SET name = $1, code = $2 WHERE id = $3`,
    [name, code, id],
    (err, result) => {
      if (err) {
        console.log(err.message);
      } else {
        res.send("successfully updated");
      }
    }
  );
}

function deleteSubject(req: Request, res: Response): void {
  const id = parseInt(req.params.id);
  DbClient.query(`DELETE FROM subjects WHERE id = $1`, [id], (err, result) => {
    if (err) {
      console.log(err.message);
    } else {
      res.send("successfully deleted");
    }
  });
}

export {
  getSubject,
  getSubjectsById,
  createSubject,
  updateSubject,
  deleteSubject,
  login,
  verifyToken,
  getStudentsById,
};
export { AuthenticatedRequest };

//search code subject name bata
//get subject database function search
