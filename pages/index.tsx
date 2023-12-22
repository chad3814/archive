import { useEffect, useCallback, ChangeEvent, useState, useRef } from 'react'
import { Archive } from 'libarchive.js';
import { CompressedFile } from 'libarchive.js/src/compressed-file';
import { FilesObject } from 'libarchive.js/src/libarchive';

export default function Index() {
  const [archiveList, setArchiveList] = useState<string[]>([]);
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);

  useEffect(() => {
    Archive.init({workerUrl: '/worker-bundle.js'});
  }, []);

  const makeList = (obj: FilesObject, prefix = '') => {
    const list: string[] = [];
    for (const name of Object.keys(obj)) {
      const value = obj[name];
      if (value instanceof CompressedFile) {
        list.push(prefix + value);
      } else {
        list.push(...makeList(value as FilesObject, `${prefix}${name}/`));
      }
    }
    return list;
  }
  
  const fileChange = useCallback(
    async (evt: ChangeEvent<HTMLInputElement>) => {
      const file = evt.target.files?.[0]
      if (!file) {
        setArchiveList([]);
        return;
      }
      const archive = await Archive.open(file);
      const encrypted = await archive.hasEncryptedData();
      if (encrypted) {
        setIsEncrypted(true);
        return;
      }
      const fileObjects = await archive.getFilesObject();
      const list = makeList(fileObjects);
      setIsEncrypted(false);
      setArchiveList(list);
    }, []
  )

  return (
    <>
      <p>Select an archive file</p>
      <input type='file' onChange={fileChange}/>
      {isEncrypted && <span>Archive is encrypted</span>}
      <ul>
        {archiveList.map(
          filename => <li key={filename}>{filename}</li>
        )}
      </ul>
    </>
  )
}
