import { SyntaxError } from './syntexerror.js';
import { IdentifierError } from './identifiererror.js';
import { Namespace } from './namespace.js';


/**
 * 运行环境
 *
 * 存储和管理 namespace
 *
 * - namePath 是 namespace 的路径，其中 namePath 的第一部分是 module 名称。
 * - fullName 是 identifier 的全称，fullName = namePath + '.' + identifierName
 */
class Environment {
    constructor() {
        this.namespaces = new Map();
    }

    /**
     * 创建并返回 namespace 对象
     *
     * 如果指定的 namespace 已存在，则返回已有的 namespace 对象。
     *
     * @param {*} namePath
     */
    createNamespace(namePath) {
        let namespace = this.namespaces.get(namePath);
        if (namespace === undefined) {
            // 创建 Namespace 对象
            namespace = new Namespace()
            this.namespaces.set(namePath, namespace);
        }
        return namespace;
    }

    /**
     * 通过指定的 namePath 获取对应的 namespace 对象
     *
     * 如果指定的 namespace 不存在，则抛出 IdentifierError
     *
     * @param {*} namePath
     */
    getNamespace(namePath) {
        let namespace = this.namespaces.get(namePath);
        if (namespace === undefined) {
            throw new IdentifierError(
                'NAMESPACE_NOT_FOUND',
                { namePath },
                'Namespace not found');
        }
        return namespace;
    }

    /**
     * 通过标识符全称获取标识符
     *
     * 如果指定的标识符所在的 namespace 不存在，则抛出 IdentifierError.NAMESPACE_NOT_FOUND
     * 如果指定的标识符不存在，则抛出 IdentifierError.IDENTIFIER_ALREADY_EXIST
     *
     * @param {*} fullName
     */
    getIdentifierByFullName(fullName) {
        let { namePath, identifierName } = Environment.getNamePathAndIdentifierName(fullName);
        let namespace = this.getNamespace(namePath);
        return namespace.getIdentifier(identifierName);
    }

    /**
     * 解析出标识符全称的 namePath 和 identifierName 部分。
     *
     * @param {*} fullName
     * @returns
     */
    static getNamePathAndIdentifierName(fullName) {
        let pos = fullName.lastIndexOf('.');
        if (pos <= 0 || pos === fullName.length - 1) {
            throw new SyntaxError('Invalid identifier fullname.');
        }

        let namePath = fullName.substring(0, pos);
        let identifierName = fullName.substring(pos + 1);
        return { namePath, identifierName };
    }

    /**
     * 将下面两种路径解析为一般的绝对路径。
     *
     * - `use` 语句当中的 fullName 或者 namePath
     * - 带有相对路径的标识符 fullName
     *
     * @param {*} fullName
     * @param {*} moduleName
     * @param {*} currentNamePath 当前 namespace 的 namePath
     */
    static normalizeFullname(fullName, moduleName, currentNamespaceNamePath) {
        if (fullName.startsWith('module.')) {
            return moduleName + fullName.substring('module'.length);

        } else if (fullName.startsWith('current.')) {
            return currentNamespaceNamePath + fullName.substring('current'.length);

        } else if (fullName.startsWith('parent.')) {
            let remainPath = fullName;
            let prefixPath = currentNamespaceNamePath;
            do {
                remainPath = remainPath.substring('parent.'.length);
                let lastDotPos = prefixPath.lastIndexOf('.');
                if (lastDotPos < 0) {
                    throw new SyntaxError('RELATIVE_PATH_ERROR', { relativePath: remainPath }, 'Relative path out of range.');
                }
                prefixPath = prefixPath.substring(0, lastDotPos);
            } while (remainPath.startsWith('parent.'))
            return prefixPath + '.' + remainPath;

        } else {
            return fullName;
        }
    }
}

export { Environment };