import { useEffect, useCallback, ChangeEvent, useState, useRef } from 'react'
import { Archive } from 'libarchive.js';

interface CompressedFile {
  name: string;
  size: number;
  lastModified: number;
  extract(): Promise<File>;
}

interface FilesObject {
    [key: string]: FilesObject | CompressedFile;
};

export default function Index() {
  const [archiveMap, setArchiveMap] = useState<Map<string,CompressedFile>>(new Map);
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);

  useEffect(() => {
    Archive.init({workerUrl: '/libarchive/worker-bundle.js'});
  }, []);

  const isCompressedFile = (value: FilesObject | CompressedFile): value is CompressedFile => {
    return 'extract' in value && typeof (value as CompressedFile).extract === 'function';
  }

  const makeMap = (obj: FilesObject, prefix = '') => {
    const map = new Map<string, CompressedFile>;
    for (const name of Object.keys(obj)) {
      const value = obj[name];
      if (isCompressedFile(value)) {
        map.set(prefix + name, value);
      } else {
        const subMap = makeMap(value as FilesObject, `${prefix}${name}/`);
        for (const [n, v] of subMap.entries()) {
          map.set(n, v);
        }
      }
    }
    return map;
  }

  const fileChange = useCallback(
    async (evt: ChangeEvent<HTMLInputElement>) => {
      const file = evt.target.files?.[0]
      if (!file) {
        setArchiveMap(new Map);
        return;
      }
      const archive = await Archive.open(file);
      const encrypted = await archive.hasEncryptedData();
      if (encrypted) {
        setIsEncrypted(true);
        return;
      }
      const fileObjects = await archive.getFilesObject();
      const map = makeMap(fileObjects);
      setIsEncrypted(false);
      setArchiveMap(map);
    }, []
  )

  const getFilenames = useCallback(
    () => {
      if (!archiveMap) return [];
      return [...archiveMap.keys()];
    }, [archiveMap],
  );

  const extractFile = useCallback(
    (filename: string) => {
      if (!archiveMap.has(filename)) {
        alert('brrr no such file');
        return;
      }
      const match = filename.match(/(?<basename>[^\/]+)$/);
      const c = archiveMap.get(filename) as CompressedFile;
      c.extract().then(
        (file: File) => {
          const url = window.URL.createObjectURL(file);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = match?.groups?.basename ?? filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        }
      ).catch(
        (err: unknown) => {
          alert(`some error happened ${err as Error}`);
        }
      )
    }, [archiveMap]
  )
  return (
    <>
      <p>Select an archive file</p>
      <input type='file' onChange={fileChange} title="archive file"/>
      {isEncrypted && <span>Archive is encrypted</span>}
      <ul>
        {getFilenames().map(
          filename => <li key={filename}><a href="#" onClick={() => extractFile(filename)}>{filename}</a></li>
        )}
      </ul>
    </>
  )
}
