import LinkIcon from '@heroicons/react/24/outline/LinkIcon';
import PencilIcon from '@heroicons/react/24/outline/PencilIcon';
import PlusIcon from '@heroicons/react/24/outline/PlusIcon';
import EmptyState from '@components/EmptyState';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { LinkPrimary } from '@components/LinkPrimary';
import { IconButton } from '@components/IconButton';
import { InputWithCopyButton } from '@components/ClipboardButton';
import { Pagination, pageLimit } from '@components/Pagination';
import usePaginate from '@lib/ui/hooks/usePaginate';
import type { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toaster';
import type { ApiError, ApiSuccess } from 'types';

const ConnectionList = ({
  setupLinkToken,
  idpEntityID,
}: {
  setupLinkToken?: string;
  idpEntityID?: string;
}) => {
  const { t } = useTranslation('common');
  const { paginate, setPaginate } = usePaginate();
  const router = useRouter();

  const displayTenantProduct = setupLinkToken ? false : true;
  const getConnectionsUrl = setupLinkToken
    ? `/api/setup/${setupLinkToken}/sso-connection`
    : `/api/admin/connections?pageOffset=${paginate.offset}&pageLimit=${pageLimit}`;
  const createConnectionUrl = setupLinkToken
    ? `/setup/${setupLinkToken}/sso-connection/new`
    : '/admin/sso-connection/new';

  const { data, error } = useSWR<ApiSuccess<(SAMLSSORecord | OIDCSSORecord)[]>, ApiError>(
    getConnectionsUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!data && !error) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const connections = data?.data || [];

  if (connections && setupLinkToken && connections.length === 0) {
    router.replace(`/setup/${setupLinkToken}/sso-connection/new`);
    return null;
  }

  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('enterprise_sso')}</h2>
        <div className='flex gap-2'>
          <LinkPrimary Icon={PlusIcon} href={createConnectionUrl} data-test-id='create-connection'>
            {t('new_connection')}
          </LinkPrimary>
          {!setupLinkToken && (
            <LinkPrimary
              Icon={LinkIcon}
              href='/admin/sso-connection/setup-link/new'
              data-test-id='create-setup-link'>
              {t('new_setup_link')}
            </LinkPrimary>
          )}
        </div>
      </div>
      {idpEntityID && setupLinkToken && (
        <div className='mb-5 mt-5 items-center justify-between'>
          <div className='form-control'>
            <InputWithCopyButton text={idpEntityID} label={t('idp_entity_id')} />
          </div>
        </div>
      )}
      {connections.length === 0 && paginate.offset === 0 ? (
        <EmptyState title={t('no_connections_found')} href={createConnectionUrl} />
      ) : (
        <>
          <div className='rounder border'>
            <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr className='hover:bg-gray-50'>
                  <th scope='col' className='px-6 py-3'>
                    {t('name')}
                  </th>
                  {displayTenantProduct && (
                    <>
                      <th scope='col' className='px-6 py-3'>
                        {t('tenant')}
                      </th>
                      <th scope='col' className='px-6 py-3'>
                        {t('product')}
                      </th>
                    </>
                  )}
                  <th scope='col' className='px-6 py-3'>
                    {t('idp_type')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {connections.map((connection) => {
                  const connectionIsSAML = 'idpMetadata' in connection;
                  const connectionIsOIDC = 'oidcProvider' in connection;

                  return (
                    <tr
                      key={connection.clientID}
                      className='border-b bg-white last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                        {connection.name ||
                          (connectionIsSAML
                            ? connection.idpMetadata?.provider
                            : connection.oidcProvider?.provider)}
                      </td>
                      {displayTenantProduct && (
                        <>
                          <td className='whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900 dark:text-white'>
                            {connection.tenant}
                          </td>
                          <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                            {connection.product}
                          </td>
                        </>
                      )}
                      <td className='px-6 py-3'>
                        {connectionIsOIDC ? 'OIDC' : connectionIsSAML ? 'SAML' : ''}
                      </td>
                      <td className='px-6 py-3'>
                        <span className='inline-flex items-baseline'>
                          <IconButton
                            tooltip={t('edit')}
                            Icon={PencilIcon}
                            className='hover:text-green-400'
                            onClick={() => {
                              router.push(
                                setupLinkToken
                                  ? `/setup/${setupLinkToken}/sso-connection/edit/${connection.clientID}`
                                  : `/admin/sso-connection/edit/${connection.clientID}`
                              );
                            }}
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            itemsCount={connections.length}
            offset={paginate.offset}
            onPrevClick={() => {
              setPaginate({
                offset: paginate.offset - pageLimit,
              });
            }}
            onNextClick={() => {
              setPaginate({
                offset: paginate.offset + pageLimit,
              });
            }}
          />
        </>
      )}
    </div>
  );
};

export default ConnectionList;