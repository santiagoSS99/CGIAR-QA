import { Request, Response } from "express";
import { getRepository, In, getConnection, QueryRunner } from "typeorm";

import { QAIndicatorUser } from "@entity/IndicatorByUser";
import { QACrp } from "@entity/CRP";
import { QAEvaluations } from "@entity/Evaluations";
import { QAUsers } from "@entity/User";
import { QAIndicators } from "@entity/Indicators";
import { QAIndicatorsMeta } from "@entity/IndicatorsMeta";
import { QAComments } from "@entity/Comments";

import { StatusHandler } from "@helpers/StatusHandler";
import { DisplayTypeHandler } from "@helpers/DisplayTypeHandler";
import { RolesHandler } from "@helpers/RolesHandler";
import Util from "@helpers/Util"

import { format } from "url";
import { QACommentsReplies } from "@entity/CommentsReplies";


// import { validate } from "class-validator";
// import { runInNewContext } from "vm";

class EvaluationsController {

    /**
     * 
     * Evaluations CRUD
     * 
     */

    // get evaluations dashboard by user
    static getEvaluationsDash = async (req: Request, res: Response) => {
        //Get the ID from the url
        const id = req.params.id;
        let queryRunner = getConnection().createQueryBuilder();

        //Get evaluations from database
        try {
            //const indicatorByUserRepository = getRepository(QAIndicatorUser);

            const [query, parameters] = await queryRunner.connection.driver.escapeQueryWithParameters(
                `SELECT
                evaluations.status AS status,
                meta.enable_crp,
                meta.enable_assessor,
                evaluations.indicator_view_name AS indicator_view_name,
                indicator.primary_field AS primary_field,
                COUNT(DISTINCT evaluations.id) AS count
            FROM
                qa_indicator_user qa_indicator_user
            LEFT JOIN qa_evaluations evaluations ON evaluations.indicatorUserId = qa_indicator_user.id
            LEFT JOIN qa_indicators indicator ON indicator.view_name = evaluations.indicator_view_name
            LEFT JOIN qa_comments_meta meta ON meta.indicatorId = indicator.id
            WHERE
                qa_indicator_user.userId = :user_Id
            GROUP BY
                evaluations.status,
                evaluations.indicator_view_name,
                meta.enable_crp,
                meta.enable_assessor,
                indicator.primary_field
            ORDER BY
                evaluations.status ASC `,
                { user_Id: id },
                {}
            );
            // console.log(query, parameters)
            let rawData = await queryRunner.connection.query(query, parameters);

            let response = []
            for (let index = 0; index < rawData.length; index++) {
                const element = rawData[index];
                response.push({
                    indicator_view_name: element['indicator_view_name'],
                    status: element['status'],
                    indicator_status: element['enable_assessor'],
                    type: Util.getType(element['status']),
                    value: element['count'],
                    label: `${element['count']}`,
                    primary_field: element["primary_field"]
                    // total: element['sum'],
                })

            }


            let result = Util.groupBy(response, 'indicator_view_name');
            // console.log(result)
            res.status(200).json({ data: result, message: "User evaluations" });
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Could not access to evaluations." });
        }
    }

    // get evaluations LIST by user
    static getListEvaluationsDash = async (req: Request, res: Response) => {
        //Get the ID from the url
        const id = req.params.id;
        const view_name = req.body.view_name;
        const view_primary_field = req.body.view_primary_field;

        let queryRunner = getConnection().createQueryBuilder();

        try {
            const userRepository = getRepository(QAUsers);
            let user = await userRepository.findOneOrFail({ where: { id } });
            let isAdmin = user.roles.find(x => x.description == RolesHandler.admin);
            if (isAdmin) {
                const [query, parameters] = await queryRunner.connection.driver.escapeQueryWithParameters(
                    `SELECT
                        evaluations.id AS evaluations_id,
                        evaluations.indicator_view_id AS evaluations_indicator_view_id,
                        evaluations.status AS evaluations_status,
                        evaluations.indicator_view_name AS evaluations_indicator_view_name,
                        evaluations.crp_id AS evaluations_crp_id,
                        evaluations.general_comments AS evaluations_general_comments,
                        evaluations.indicatorUserId AS evaluations_indicatorUserId,
                        ${view_name}.title AS title,
                        crp.acronym AS acronym,
                        crp.name AS crp_name
                    FROM
                        qa_indicator_user qa_indicator_user
                    LEFT JOIN qa_evaluations evaluations ON evaluations.indicatorUserId = qa_indicator_user.id
                    LEFT JOIN ${view_name} ${view_name} ON ${view_name}.${view_primary_field}= evaluations.indicator_view_id
                    LEFT JOIN qa_crp crp ON crp.crp_id = evaluations.crp_id
                    WHERE title IS NOT NULL
                    AND evaluations.indicator_view_name = :view_name `,
                    { view_name },
                    {}
                );
                let rawData = await queryRunner.connection.query(query, parameters);
                res.status(200).json({ data: Util.parseEvaluationsData(rawData), message: "User evaluations list" });
                return;
            } else if (user.crp) {
                const [query, parameters] = await queryRunner.connection.driver.escapeQueryWithParameters(
                    `SELECT
                        evaluations.id AS evaluations_id,
                        evaluations.indicator_view_id AS evaluations_indicator_view_id,
                        evaluations.status AS evaluations_status,
                        evaluations.indicator_view_name AS evaluations_indicator_view_name,
                        evaluations.crp_id AS evaluations_crp_id,
                        evaluations.general_comments AS evaluations_general_comments,
                        evaluations.indicatorUserId AS evaluations_indicatorUserId,
                        ${view_name}.title AS title,
                        crp.acronym AS acronym,
                        crp.name AS crp_name,
                        (
                            SELECT COUNT(id)
                            FROM qa_comments
                            WHERE qa_comments.evaluationId = evaluations.id
                        ) AS comments_count
                    FROM
                        qa_indicator_user qa_indicator_user
                    LEFT JOIN qa_evaluations evaluations ON evaluations.indicatorUserId = qa_indicator_user.id
                    LEFT JOIN ${view_name} ${view_name} ON ${view_name}.${view_primary_field}= evaluations.indicator_view_id
                    LEFT JOIN qa_crp crp ON crp.crp_id = evaluations.crp_id
                    WHERE
                        evaluations.crp_id = :crp_id
                    AND title IS NOT NULL
                    AND evaluations.indicator_view_name = :view_name `,
                    { crp_id: user.crp.crp_id, view_name },
                    {}
                );
                console.log(user.crp.crp_id)
                let rawData = await queryRunner.connection.query(query, parameters);
                res.status(200).json({ data: Util.parseEvaluationsData(rawData), message: "CRP evaluations list" });

            }
            else {
                const [query, parameters] = await queryRunner.connection.driver.escapeQueryWithParameters(
                    `SELECT
                        evaluations.id AS evaluations_id,
                        evaluations.indicator_view_id AS evaluations_indicator_view_id,
                        evaluations.status AS evaluations_status,
                        evaluations.indicator_view_name AS evaluations_indicator_view_name,
                        evaluations.crp_id AS evaluations_crp_id,
                        evaluations.general_comments AS evaluations_general_comments,
                        evaluations.indicatorUserId AS evaluations_indicatorUserId,
                        ${view_name}.title AS title,
                        crp.acronym AS acronym,
                        crp.name AS crp_name
                    FROM
                        qa_indicator_user qa_indicator_user
                    LEFT JOIN qa_evaluations evaluations ON evaluations.indicatorUserId = qa_indicator_user.id
                    LEFT JOIN ${view_name} ${view_name} ON ${view_name}.${view_primary_field}= evaluations.indicator_view_id
                    LEFT JOIN qa_crp crp ON crp.crp_id = evaluations.crp_id
                    WHERE
                        qa_indicator_user.userId = :user_Id
                    AND title IS NOT NULL
                    AND evaluations.indicator_view_name = :view_name `,
                    { user_Id: id, view_name },
                    {}
                );
                let rawData = await queryRunner.connection.query(query, parameters);
                console.log(rawData)
                res.status(200).json({ data: Util.parseEvaluationsData(rawData), message: "User evaluations list" });

            }


        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Could not access to evaluations." });
        }
    }


    // get detailed evaluation by user
    static getDetailedEvaluationDash = async (req: Request, res: Response) => {

        //Get the ID from the url
        const id = req.params.id;
        const view_name = `qa_${req.body.type}`;
        const view_name_psdo = `${req.body.type}`;
        const view_primary_field = req.body.primary_column;
        const indicatorId = req.body.indicatorId;

        //Get indicator item data from view
        try {
            const userRepository = getRepository(QAUsers);
            let user = await userRepository.findOneOrFail({ where: { id } });
            let isAdmin = user.roles.find(x => x.description == RolesHandler.admin);
            let rawData;
            if (isAdmin) {

                const indicatorByUserRepository = getRepository(QAIndicatorUser);
                rawData = await indicatorByUserRepository
                    .createQueryBuilder("qa_indicator_user")
                    .select(`${view_name_psdo}.title AS title`)
                    //.addSelect(`${view_name_psdo}.crp AS crp`)
                    .andWhere("evaluations.indicator_view_id=:indicatorId", { indicatorId })
                    .andWhere("evaluations.indicator_view_name=:view_name", { view_name })
                    .leftJoinAndSelect("qa_indicator_user.evaluations", "evaluations")
                    .leftJoinAndSelect(view_name, view_name_psdo, `${view_name_psdo}.${view_primary_field}= evaluations.indicator_view_id`)
                    .leftJoinAndSelect("qa_indicators_meta", "meta", `meta.indicatorId= qa_indicator_user.indicatorId`)
                    //.groupBy('meta.id')
                    .getRawMany();
                //.getSql();
            }
            else if (user.crp) {

                const indicatorByUserRepository = getRepository(QAIndicatorUser);
                rawData = await indicatorByUserRepository
                    .createQueryBuilder("qa_indicator_user")
                    .select(`${view_name_psdo}.title AS title`)
                    //.addSelect(`${view_name_psdo}.crp AS crp`)
                    .where("evaluations.crp_id=:crp_id", { crp_id: user.crp.crp_id })
                    .andWhere("evaluations.indicator_view_id=:indicatorId", { indicatorId })
                    .andWhere("evaluations.indicator_view_name=:view_name", { view_name })
                    .leftJoinAndSelect("qa_indicator_user.evaluations", "evaluations")
                    .leftJoinAndSelect(view_name, view_name_psdo, `${view_name_psdo}.${view_primary_field}= evaluations.indicator_view_id`)
                    .leftJoinAndSelect("qa_indicators_meta", "meta", `meta.indicatorId= qa_indicator_user.indicatorId`)
                    //.groupBy('meta.id')
                    .getRawMany();
            }
            else {
                const indicatorByUserRepository = getRepository(QAIndicatorUser);
                rawData = await indicatorByUserRepository
                    .createQueryBuilder("qa_indicator_user")
                    .select(`${view_name_psdo}.title AS title`)
                    //.addSelect(`${view_name_psdo}.crp AS crp`)
                    .where("qa_indicator_user.user=:userId", { userId: id })
                    .andWhere("evaluations.indicator_view_id=:indicatorId", { indicatorId })
                    .andWhere("evaluations.indicator_view_name=:view_name", { view_name })
                    .leftJoinAndSelect("qa_indicator_user.evaluations", "evaluations")
                    .leftJoinAndSelect(view_name, view_name_psdo, `${view_name_psdo}.${view_primary_field}= evaluations.indicator_view_id`)
                    .leftJoinAndSelect("qa_indicators_meta", "meta", `meta.indicatorId= qa_indicator_user.indicatorId`)
                    //.groupBy('meta.id')
                    .getRawMany();
                // .getSql();

            }
            console.log(rawData)
            // res.status(200).json({ data: (rawData), message: "User evaluation detail" });
            res.status(200).json({ data: Util.parseEvaluationsData(rawData, view_name_psdo), message: "User evaluation detail" });
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Could not access to evaluations." });
        }
    }

    static updateDetailedEvaluation = async (req: Request, res: Response) => {
        const id = req.params.id;
        const { general_comments, status } = req.body;
        const evaluationsRepository = getRepository(QAEvaluations);

        // console.log({ general_comments, status }, id)
        try {
            let evaluation = await evaluationsRepository.findOneOrFail(id);
            evaluation.general_comments = general_comments;
            evaluation.status = status;

            let updatedEva = await evaluationsRepository.save(evaluation);
            res.status(200).json({ data: updatedEva, message: "Evaluation updated." });

        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Could not update evaluation.", data: error });
        }
    }





    // get all evaluations dashboard
    static getAllEvaluationsDash = async (req: Request, res: Response) => {

        let { crp_id } = req.query;
        let queryRunner = getConnection().createQueryBuilder();


        try {
            let rawData;
            if (crp_id !== undefined && crp_id !== "undefined") {
                const [query, parameters] = await queryRunner.connection.driver.escapeQueryWithParameters(
                    `SELECT
                    evaluations.status AS status,
                    evaluations.crp_id AS crp_id,
                    evaluations.indicator_view_name AS indicator_view_name,
                    indicator.primary_field AS primary_field,
                    COUNT (DISTINCT evaluations.id) AS count
                FROM
                    qa_indicator_user qa_indicator_user
                LEFT JOIN qa_evaluations evaluations ON evaluations.indicatorUserId = qa_indicator_user.id
                LEFT JOIN qa_indicators indicator ON indicator.view_name = evaluations.indicator_view_name
                WHERE
                    crp_id = :crp_id
                GROUP BY
                    evaluations.status,
                    evaluations.indicator_view_name,
                    evaluations.crp_id,
                    indicator.primary_field
                ORDER BY
                    evaluations.status ASC `,
                    { crp_id: crp_id },
                    {}
                );
                rawData = await queryRunner.connection.query(query, parameters);
            } else {
                const [query, parameters] = await queryRunner.connection.driver.escapeQueryWithParameters(
                    `SELECT
                    evaluations.status AS status,
                   
                    evaluations.indicator_view_name AS indicator_view_name,
                    indicator.primary_field AS primary_field,
                    COUNT (DISTINCT evaluations.id) AS count
                FROM
                    qa_indicator_user qa_indicator_user
                LEFT JOIN qa_evaluations evaluations ON evaluations.indicatorUserId = qa_indicator_user.id
                LEFT JOIN qa_indicators indicator ON indicator.view_name = evaluations.indicator_view_name
                GROUP BY
                    evaluations.status,
                    evaluations.indicator_view_name,
                   
                    indicator.primary_field
                ORDER BY
                    evaluations.status ASC `,
                    {},
                    {}
                );
                rawData = await queryRunner.connection.query(query, parameters);
            }

            let response = []

            for (let index = 0; index < rawData.length; index++) {
                const element = rawData[index];
                response.push({
                    indicator_view_name: element['indicator_view_name'],
                    status: element['status'],
                    type: Util.getType(element['status']),
                    value: element['count'],
                    crp_id: (crp_id) ? element['crp_id'] : null,
                    label: `${element['count']}`,
                    primary_field: element["primary_field"]
                })

            }

            let result = Util.groupBy(response, 'indicator_view_name');
            // res.status(200).json({ data: rawData, message: "All evaluations" });
            res.status(200).json({ data: result, message: "All evaluations" });
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Could not access to evaluations." });
        }

    }

    // get all CRPS
    static getCRPS = async (req: Request, res: Response) => {

        const crpRepository = await getRepository(QACrp);

        try {
            let allCRP = await crpRepository.find();
            res.status(200).json({ data: allCRP, message: "All CRPs" });
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Could not get crp." });
        }

    }

    //get indicators by crp (admin dashboard)
    static getIndicatorsByCrp = async (req: Request, res: Response) => {
        //const indiUserRepository = getRepository(QAIndicatorUser);
        let queryRunner = getConnection().createQueryBuilder();
        try {

            const [query, parameters] = await queryRunner.connection.driver.escapeQueryWithParameters(
                `SELECT
                        indicators.id,
                        meta.enable_assessor,
                        meta.enable_crp,
                        indicators. NAME AS indicator_view_name
                    FROM
                        qa_indicator_user qa_indicator_user
                    LEFT JOIN qa_evaluations evaluations ON evaluations.indicatorUserId = qa_indicator_user.id
                    LEFT JOIN qa_indicators indicators ON indicators.view_name = evaluations.indicator_view_name
                    LEFT JOIN qa_comments_meta meta ON indicators.id = meta.indicatorId
                    GROUP BY
                        indicators.id,
                        meta.enable_assessor,
                        meta.enable_crp,
                        indicators. NAME
                       `,
                {},
                {}
            );
            let evalData = await queryRunner.connection.query(query, parameters);
            res.status(200).json({ data: evalData, message: "Indicators by crp" });

        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Could not get indicators by crp." });
        }
    }



    // create general comment 


    // create reply by comment
    static createCommentReply = async (req: Request, res: Response) => {

        //Check if username and password are set
        const { detail, userId, commentId, crp_approved, approved } = req.body;
        // const evaluationId = req.params.id;

        const userRepository = getRepository(QAUsers);
        const commentReplyRepository = getRepository(QACommentsReplies);
        const commentsRepository = getRepository(QAComments);

        try {

            let user = await userRepository.findOneOrFail({ where: { id: userId } });
            let comment = await commentsRepository.findOneOrFail({ where: { id: commentId } });
            let reply = new QACommentsReplies();
            reply.detail = detail;
            reply.comment = comment;
            reply.user = user;

            let new_replay = await commentReplyRepository.save(reply);
            if (user.roles.find(x => x.description == RolesHandler.crp)) {
                comment.crp_approved = crp_approved;
                comment = await commentsRepository.save(comment);
            }
            // else if(user.roles.find(x => x.description == RolesHandler.admin)){
            //     comment.approved = approved;
            //     comment = await commentsRepository.save(comment);
            // }
            // console.log(new_replay)
            res.status(200).send({ data: new_replay, message: 'Comment created' });

        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Comment can not be created.", data: error });
        }
    }

    // create comment by indicator
    static createComment = async (req: Request, res: Response) => {

        //Check if username and password are set
        const { detail, approved, userId, metaId, evaluationId } = req.body;
        // const evaluationId = req.params.id;

        const userRepository = getRepository(QAUsers);
        const metaRepository = getRepository(QAIndicatorsMeta);
        const evaluationsRepository = getRepository(QAEvaluations);
        const commentsRepository = getRepository(QAComments);

        try {

            let user = await userRepository.findOneOrFail({ where: { id: userId } });
            let meta = await metaRepository.findOneOrFail({ where: { id: metaId } });
            let evaluation = await evaluationsRepository.findOneOrFail({ where: { id: evaluationId } });

            let comment_ = new QAComments();
            comment_.detail = detail;
            comment_.approved = approved;
            comment_.meta = meta;
            comment_.evaluation = evaluation;
            comment_.user = user;

            let new_comment = await commentsRepository.save(comment_);

            res.status(200).send({ data: new_comment, message: 'Comment created' });

        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Comment can not be created.", data: error });
        }
    }

    // update comment by indicator
    static updateComment = async (req: Request, res: Response) => {

        //Check if username and password are set
        const { approved, is_visible, is_deleted, id } = req.body;
        const commentsRepository = getRepository(QAComments);

        try {
            let comment_ = await commentsRepository.findOneOrFail(id);
            comment_.approved = approved;
            comment_.is_deleted = is_deleted;
            comment_.is_visible = is_visible;


            let updated_comment = await commentsRepository.save(comment_);

            res.status(200).send({ data: updated_comment, message: 'Comment created' });

        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Comment can not be created.", data: error });
        }
    }

    // get comments by indicator
    static getComments = async (req: Request, res: Response) => {
        const evaluationId = req.params.evaluationId;
        const metaId = req.params.metaId;

        const commentsRepository = getRepository(QAComments);
        let queryRunner = getConnection().createQueryBuilder();
        try {
            const [query, parameters] = await queryRunner.connection.driver.escapeQueryWithParameters(
                `SELECT
                id, (
                    SELECT
                        COUNT(DISTINCT id)
                    FROM
                        qa_comments_replies
                    WHERE
                        commentId = qa_comments.id
                ) AS replies_count
                FROM
                    qa_comments
                WHERE
                    metaId = :metaId
                AND evaluationId = :evaluationId
                `,
                { metaId, evaluationId },
                {}
            );
            let replies = await queryRunner.connection.query(query, parameters);
            let comments = await commentsRepository.find({
                where: {
                    meta: metaId, evaluation: evaluationId
                }, relations: ['user']
            });
            for (let index = 0; index < comments.length; index++) {
                const comment = comments[index];
                comment.replies = replies.find(reply => reply.id == comment.id)
            }
            res.status(200).send({ data: comments, message: 'Comments' });

        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Comment can not be retrived.", data: error });
        }

    }

    // get comments replies
    static getCommentsReplies = async (req: Request, res: Response) => {
        const commentId = req.params.commentId;

        let queryRunner = getConnection().createQueryBuilder();
        try {
            // const [query, parameters] = await queryRunner.connection.driver.escapeQueryWithParameters(
            //     `SELECT
            //     *
            //     FROM
            //         qa_comments_replies
            //     WHERE
            //         commentId = :commentId
            //     `,
            //     { commentId },
            //     {}
            // );
            // let replies = await queryRunner.connection.query(query, parameters);
            let replies = await getRepository(QACommentsReplies).find(
                {
                    where: [{
                        comment: commentId
                    }],
                    relations: ['user']
                }
            )
            res.status(200).send({ data: replies, message: 'Comments' });
        } catch (error) {
            console.log(error);
            res.status(404).json({ message: "Comment can not be retrived.", data: error });
        }
    }
}


export default EvaluationsController;